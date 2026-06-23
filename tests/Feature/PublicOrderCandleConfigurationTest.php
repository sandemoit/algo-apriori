<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicOrderCandleConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_order_form_is_available_before_store_settings_are_seeded(): void
    {
        $this->get(route('order'))->assertOk();
    }

    public function test_database_seeder_populates_the_public_catalog(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('cake_sizes', 4);
        $this->assertDatabaseCount('cake_shapes', 4);
        $this->assertDatabaseCount('additional_items', 5);
        $this->assertDatabaseCount('store_settings', 1);
    }

    public function test_number_candle_configuration_is_saved_with_a_pickup_order(): void
    {
        Queue::fake();
        $catalog = $this->createCatalog();

        $response = $this->post(route('order.store'), $this->orderData($catalog, [
            'id' => $catalog['candle']->id,
            'quantity' => 1,
            'configuration' => ['type' => 'number', 'number' => '21'],
        ]));

        $order = Order::query()->firstOrFail();

        $response->assertRedirect(route('invoice.show', $order->public_token));
        $this->assertSame('pickup', $order->fulfillment_method->value);
        $this->assertSame('0.00', $order->delivery_fee);
        $this->assertSame(['type' => 'number', 'number' => '21'], $order->additionalItems()->sole()->configuration);
    }

    public function test_delivery_requires_an_address_and_uses_the_store_delivery_fee(): void
    {
        Queue::fake();
        $catalog = $this->createCatalog();

        $invalid = $this->from(route('order'))->post(route('order.store'), $this->orderData($catalog, [], [
            'fulfillment_method' => 'delivery',
            'delivery_address' => '',
        ]));

        $invalid->assertRedirect(route('order'));
        $invalid->assertSessionHasErrors('delivery_address');

        $this->post(route('order.store'), $this->orderData($catalog, [], [
            'fulfillment_method' => 'delivery',
            'delivery_address' => 'Jl. Mawar No. 21, Bandung',
        ]));

        $order = Order::query()->latest('id')->firstOrFail();
        $this->assertSame('delivery', $order->fulfillment_method->value);
        $this->assertSame('Jl. Mawar No. 21, Bandung', $order->delivery_address);
        $this->assertSame('15000.00', $order->delivery_fee);
        $this->assertSame('165000.00', $order->grand_total);
    }

    public function test_order_is_accepted_at_the_exact_opening_time(): void
    {
        Queue::fake();
        $catalog = $this->createCatalog();

        $response = $this->post(route('order.store'), $this->orderData($catalog, [], [
            'fulfillment_at' => now()->addDays(2)->setTime(8, 0)->toDateTimeString(),
        ]));

        $response->assertSessionDoesntHaveErrors('fulfillment_at');
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_done_confirms_payment_and_completes_the_order(): void
    {
        Queue::fake();
        $catalog = $this->createCatalog();
        $this->post(route('order.store'), $this->orderData($catalog));
        $order = Order::query()->firstOrFail();
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from(route('admin.orders.show', $order))
            ->patch(route('admin.orders.complete', $order));

        $response->assertRedirect(route('admin.orders.show', $order));
        $order->refresh();
        $this->assertSame('completed', $order->status->value);
        $this->assertSame('paid', $order->payment_status->value);
        $this->assertSame($user->id, $order->completed_by);
        $this->assertSame($user->id, $order->paid_by);
        $this->assertNotNull($order->completed_at);
        $this->assertNotNull($order->paid_at);
    }

    /** @return array{size: CakeSize, shape: CakeShape, candle: AdditionalItem} */
    private function createCatalog(): array
    {
        StoreSetting::query()->create([
            'store_name' => 'Kue Bahagia',
            'store_phone' => '6281234567890',
            'admin_whatsapp' => '6281234567890',
            'customer_order_template' => 'Order {order_number}',
            'admin_order_template' => 'Order {order_number}',
            'opening_time' => '08:00',
            'closing_time' => '20:00',
            'minimum_pickup_days' => 1,
            'delivery_fee' => 15000,
        ]);

        return [
            'size' => CakeSize::query()->create(['name' => '20 cm', 'base_price' => 150000]),
            'shape' => CakeShape::query()->create(['name' => 'Bulat']),
            'candle' => AdditionalItem::query()->create(['code' => 'candle', 'name' => 'Lilin', 'price' => 1000, 'unit' => 'pcs']),
        ];
    }

    /** @param array{size: CakeSize, shape: CakeShape, candle: AdditionalItem} $catalog */
    /** @param array<string, mixed> $item */
    /** @param array<string, mixed> $overrides */
    /** @return array<string, mixed> */
    private function orderData(array $catalog, array $item = [], array $overrides = []): array
    {
        return array_merge([
            'submission_token' => (string) Str::uuid(),
            'customer_name' => 'Sandi',
            'customer_phone' => '081234567890',
            'fulfillment_method' => 'pickup',
            'fulfillment_at' => now()->addDays(2)->setTime(10, 0)->toDateTimeString(),
            'cake_size_id' => $catalog['size']->id,
            'cake_shape_id' => $catalog['shape']->id,
            'items' => $item === [] ? [] : [$item],
        ], $overrides);
    }
}
