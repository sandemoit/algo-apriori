<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\AdditionalItem;
use App\Models\AprioriAnalysisRun;
use App\Models\AprioriRule;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AprioriReportTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CakeSize $size;

    private CakeShape $shape;

    /** @var array<string, AdditionalItem> */
    private array $items;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->size = CakeSize::query()->create([
            'name' => '20 cm',
            'base_price' => 150000,
        ]);
        $this->shape = CakeShape::query()->create(['name' => 'Bulat']);
        $this->items = [
            'brownies' => AdditionalItem::query()->create(['name' => 'Brownies', 'price' => 50000]),
            'nastar' => AdditionalItem::query()->create(['name' => 'Nastar', 'price' => 45000]),
            'kopi' => AdditionalItem::query()->create(['name' => 'Kopi Susu', 'price' => 18000]),
        ];
    }

    public function test_dataset_uses_only_completed_paid_orders_in_selected_date_range(): void
    {
        $this->seedAprioriOrders();

        $this->runAnalysis();

        $run = AprioriAnalysisRun::query()->firstOrFail();
        $this->assertSame(4, $run->transaction_count);
        $this->assertSame(3, $run->unique_item_count);
    }

    public function test_duplicate_quantity_is_counted_once_per_basket(): void
    {
        $this->createOrder(['brownies'], quantity: 3);

        $this->runAnalysis(minimumOccurrence: 1);

        $this->assertDatabaseHas('apriori_itemsets', [
            'item_count' => 1,
            'support_count' => 1,
            'support' => 1,
        ]);
    }

    public function test_support_confidence_and_lift_are_calculated_correctly(): void
    {
        $this->seedAprioriOrders();

        $this->runAnalysis(minimumSupport: 25, minimumConfidence: 50, minimumOccurrence: 1);

        $rule = $this->rule('brownies', 'nastar');
        $this->assertEqualsWithDelta(0.5, (float) $rule->support, 0.000001);
        $this->assertEqualsWithDelta(0.5, (float) $rule->confidence, 0.000001);
        $this->assertEqualsWithDelta(1.0, (float) $rule->lift, 0.000001);
        $this->assertSame(2, $rule->support_count);
    }

    public function test_rules_below_support_or_confidence_are_not_displayed(): void
    {
        $this->seedAprioriOrders();

        $this->runAnalysis(minimumSupport: 25, minimumConfidence: 60, minimumOccurrence: 1);

        $this->assertNull($this->optionalRule('brownies', 'nastar'));
        $this->assertNotNull($this->optionalRule('nastar', 'brownies'));
    }

    public function test_admin_can_run_open_history_and_export_analysis(): void
    {
        $this->seedAprioriOrders();

        $response = $this->runAnalysis();

        $run = AprioriAnalysisRun::query()->firstOrFail();
        $response->assertRedirect(route('admin.reports', ['run_id' => $run->id]));

        $this->actingAs($this->user)
            ->get(route('admin.reports', ['run_id' => $run->id]))
            ->assertOk();

        $this->actingAs($this->user)
            ->get(route('admin.reports.export', ['run_id' => $run->id, 'type' => 'rules']))
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_guest_cannot_access_reports(): void
    {
        $this->get(route('admin.reports'))->assertRedirect(route('login'));
    }

    public function test_no_transactions_is_handled_without_exception(): void
    {
        $this->runAnalysis();

        $run = AprioriAnalysisRun::query()->firstOrFail();
        $this->assertSame(0, $run->transaction_count);
        $this->assertSame(0, $run->rule_count);
    }

    /** @return TestResponse<RedirectResponse> */
    private function runAnalysis(
        int $minimumSupport = 25,
        int $minimumConfidence = 50,
        int $minimumOccurrence = 1,
    ) {
        return $this->actingAs($this->user)->post(route('admin.apriori.store'), [
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-30',
            'minimum_support' => $minimumSupport,
            'minimum_confidence' => $minimumConfidence,
            'minimum_lift' => 0,
            'maximum_itemset' => 3,
            'maximum_rules' => 50,
            'minimum_occurrence' => $minimumOccurrence,
            'sort_by' => 'lift',
        ]);
    }

    private function seedAprioriOrders(): void
    {
        $this->createOrder(['brownies', 'nastar', 'kopi']);
        $this->createOrder(['brownies', 'nastar']);
        $this->createOrder(['brownies', 'kopi']);
        $this->createOrder(['brownies'], quantity: 3);
        $this->createOrder(['nastar', 'kopi'], status: OrderStatus::Cancelled);
        $this->createOrder(['nastar', 'kopi'], status: OrderStatus::Pending);
        $this->createOrder(['nastar', 'kopi'], paymentStatus: PaymentStatus::Unpaid);
        $this->createOrder(['brownies', 'nastar'], fulfillmentAt: '2026-05-20 10:00:00');
    }

    /**
     * @param  array<int, string>  $itemKeys
     */
    private function createOrder(
        array $itemKeys,
        OrderStatus $status = OrderStatus::Completed,
        PaymentStatus $paymentStatus = PaymentStatus::Paid,
        string $fulfillmentAt = '2026-06-10 10:00:00',
        int $quantity = 1,
    ): Order {
        $customer = Customer::query()->create([
            'name' => 'Pelanggan '.Str::random(5),
            'phone' => '628'.random_int(100000000, 999999999),
        ]);

        $order = Order::query()->create([
            'public_token' => (string) Str::ulid(),
            'order_number' => 'INV-'.Str::upper(Str::random(8)),
            'customer_id' => $customer->id,
            'cake_size_id' => $this->size->id,
            'cake_shape_id' => $this->shape->id,
            'source' => OrderSource::Public,
            'ordered_at' => '2026-06-01 09:00:00',
            'fulfillment_at' => $fulfillmentAt,
            'fulfillment_method' => FulfillmentMethod::Pickup,
            'customer_name_snapshot' => $customer->name,
            'customer_phone_snapshot' => $customer->phone,
            'cake_size_snapshot' => $this->size->name,
            'cake_shape_snapshot' => $this->shape->name,
            'cake_price' => 150000,
            'additional_items_total' => 0,
            'grand_total' => 150000,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'completed_at' => $status === OrderStatus::Completed ? $fulfillmentAt : null,
            'paid_at' => $paymentStatus === PaymentStatus::Paid ? $fulfillmentAt : null,
        ]);

        foreach ($itemKeys as $key) {
            $item = $this->items[$key];
            $order->additionalItems()->create([
                'additional_item_id' => $item->id,
                'item_name_snapshot' => $item->name,
                'unit_snapshot' => 'pcs',
                'unit_price' => $item->price,
                'quantity' => $quantity,
                'subtotal' => (float) $item->price * $quantity,
            ]);
        }

        return $order;
    }

    private function rule(string $antecedent, string $consequent): AprioriRule
    {
        $rule = $this->optionalRule($antecedent, $consequent);
        $this->assertNotNull($rule);

        return $rule;
    }

    private function optionalRule(string $antecedent, string $consequent): ?AprioriRule
    {
        return AprioriRule::query()
            ->whereHas('items', fn ($query) => $query
                ->where('side', 'antecedent')
                ->where('additional_item_id', $this->items[$antecedent]->id))
            ->whereHas('items', fn ($query) => $query
                ->where('side', 'consequent')
                ->where('additional_item_id', $this->items[$consequent]->id))
            ->first();
    }
}
