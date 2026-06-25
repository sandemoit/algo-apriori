<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Customer;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOrderListTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private CakeSize $size;

    private CakeShape $shape;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-06-25 10:00:00');

        $this->user = User::factory()->create();
        $this->size = CakeSize::query()->create([
            'name' => '20 cm',
            'base_price' => 150000,
        ]);
        $this->shape = CakeShape::query()->create([
            'name' => 'Bulat',
            'price_adjustment' => 0,
        ]);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_order_summary_counts_today_orders_only(): void
    {
        $this->createOrder(OrderStatus::Pending, '2026-06-25 08:00:00');
        $this->createOrder(OrderStatus::Completed, '2026-06-25 09:00:00');
        $this->createOrder(OrderStatus::Cancelled, '2026-06-25 09:30:00');
        $this->createOrder(OrderStatus::Pending, '2026-06-24 09:00:00');

        $this->actingAs($this->user)
            ->get(route('admin.orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders')
                ->where('summary.total', 3)
                ->where('summary.completed', 1)
                ->where('summary.pending', 1),
            );
    }

    public function test_admin_can_upload_store_logo(): void
    {
        Storage::fake('public');

        StoreSetting::query()->create(StoreSetting::defaults());

        $this->actingAs($this->user)
            ->post(route('admin.settings.update'), [
                '_method' => 'put',
                'store_name' => 'Kue Bahagia',
                'store_phone' => '6281234567890',
                'admin_whatsapp' => '6281234567890',
                'store_address' => 'Jl. Mawar',
                'logo' => UploadedFile::fake()->image('logo.png', 300, 300),
                'customer_order_template' => 'Pesanan {order_number}',
                'admin_order_template' => 'Pesanan baru {order_number}',
                'public_order_enabled' => true,
                'minimum_pickup_days' => 1,
                'opening_time' => '08:00',
                'closing_time' => '20:00',
                'delivery_fee' => 0,
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $logoPath = StoreSetting::query()->firstOrFail()->logo_path;

        $this->assertNotNull($logoPath);
        Storage::disk('public')->assertExists($logoPath);
    }

    private function createOrder(OrderStatus $status, string $orderedAt): Order
    {
        $customer = Customer::query()->create([
            'name' => 'Pelanggan '.Str::random(5),
            'phone' => '628'.random_int(100000000, 999999999),
        ]);

        return Order::query()->create([
            'public_token' => (string) Str::ulid(),
            'order_number' => 'INV-'.Str::upper(Str::random(8)),
            'customer_id' => $customer->id,
            'cake_size_id' => $this->size->id,
            'cake_shape_id' => $this->shape->id,
            'source' => OrderSource::Public,
            'ordered_at' => $orderedAt,
            'fulfillment_at' => '2026-06-26 10:00:00',
            'fulfillment_method' => FulfillmentMethod::Pickup,
            'customer_name_snapshot' => $customer->name,
            'customer_phone_snapshot' => $customer->phone,
            'cake_size_snapshot' => $this->size->name,
            'cake_shape_snapshot' => $this->shape->name,
            'cake_price' => 150000,
            'additional_items_total' => 0,
            'grand_total' => 150000,
            'status' => $status,
            'payment_status' => $status === OrderStatus::Completed ? PaymentStatus::Paid : PaymentStatus::Unpaid,
            'completed_at' => $status === OrderStatus::Completed ? $orderedAt : null,
            'paid_at' => $status === OrderStatus::Completed ? $orderedAt : null,
        ]);
    }
}
