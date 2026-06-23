<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AprioriDemoSeeder extends Seeder
{
    private CakeSize $size;

    private CakeShape $shape;

    /** @var array<string, AdditionalItem> */
    private array $items;

    public function run(): void
    {
        $this->size = CakeSize::query()->where('name', '20 cm')->firstOrFail();
        $this->shape = CakeShape::query()->where('name', 'Bulat')->firstOrFail();
        $this->items = AdditionalItem::query()
            ->whereIn('name', ['Lilin', 'Pisau', 'Piring', 'Balon', 'Topper'])
            ->get()
            ->keyBy('name')
            ->all();

        foreach ($this->eligibleOrders() as $index => $basket) {
            $this->createDemoOrder(
                orderNumber: sprintf('DEMO-APR-%03d', $index + 1),
                customerName: sprintf('Demo Apriori %02d', $index + 1),
                phone: sprintf('628230600%04d', $index + 1),
                itemNames: $basket,
                fulfillmentAt: Carbon::parse('2026-06-05 10:00:00')->addDays($index),
            );
        }

        $this->createDemoOrder(
            orderNumber: 'DEMO-APR-PENDING',
            customerName: 'Demo Pending',
            phone: '6282306990001',
            itemNames: ['Lilin', 'Pisau'],
            status: OrderStatus::Pending,
            paymentStatus: PaymentStatus::Unpaid,
        );

        $this->createDemoOrder(
            orderNumber: 'DEMO-APR-CANCELLED',
            customerName: 'Demo Cancelled',
            phone: '6282306990002',
            itemNames: ['Lilin', 'Pisau'],
            status: OrderStatus::Cancelled,
            paymentStatus: PaymentStatus::Unpaid,
        );

        $this->createDemoOrder(
            orderNumber: 'DEMO-APR-UNPAID',
            customerName: 'Demo Unpaid',
            phone: '6282306990003',
            itemNames: ['Lilin', 'Pisau'],
            paymentStatus: PaymentStatus::Unpaid,
        );

        $this->createDemoOrder(
            orderNumber: 'DEMO-APR-OUTSIDE',
            customerName: 'Demo Outside Range',
            phone: '6282306990004',
            itemNames: ['Lilin', 'Pisau'],
            fulfillmentAt: Carbon::parse('2026-05-20 10:00:00'),
        );
    }

    /** @return array<int, array<int, string>> */
    private function eligibleOrders(): array
    {
        return [
            ['Lilin', 'Pisau', 'Piring'],
            ['Lilin', 'Pisau'],
            ['Lilin', 'Pisau', 'Topper'],
            ['Lilin', 'Pisau', 'Balon'],
            ['Lilin', 'Piring'],
            ['Lilin', 'Pisau', 'Piring'],
            ['Pisau', 'Piring'],
            ['Balon', 'Topper'],
            ['Lilin', 'Topper'],
            ['Pisau', 'Topper'],
        ];
    }

    /**
     * @param  array<int, string>  $itemNames
     */
    private function createDemoOrder(
        string $orderNumber,
        string $customerName,
        string $phone,
        array $itemNames,
        ?Carbon $fulfillmentAt = null,
        OrderStatus $status = OrderStatus::Completed,
        PaymentStatus $paymentStatus = PaymentStatus::Paid,
    ): void {
        $fulfillmentAt ??= Carbon::parse('2026-06-23 10:00:00');

        $customer = Customer::query()->updateOrCreate(
            ['phone' => $phone],
            ['name' => $customerName, 'last_order_at' => $fulfillmentAt],
        );

        $order = Order::query()->updateOrCreate(
            ['order_number' => $orderNumber],
            [
                'public_token' => (string) Str::ulid(),
                'customer_id' => $customer->id,
                'cake_size_id' => $this->size->id,
                'cake_shape_id' => $this->shape->id,
                'source' => OrderSource::Admin,
                'ordered_at' => $fulfillmentAt->copy()->subDay(),
                'fulfillment_at' => $fulfillmentAt,
                'fulfillment_method' => FulfillmentMethod::Pickup,
                'customer_name_snapshot' => $customer->name,
                'customer_phone_snapshot' => $customer->phone,
                'cake_size_snapshot' => $this->size->name,
                'cake_shape_snapshot' => $this->shape->name,
                'cake_text' => 'Demo Apriori',
                'base_color' => 'Coklat',
                'decoration_color' => 'Putih',
                'cake_price' => $this->size->base_price,
                'additional_items_total' => 0,
                'grand_total' => $this->size->base_price,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'completed_at' => $status === OrderStatus::Completed ? $fulfillmentAt : null,
                'paid_at' => $paymentStatus === PaymentStatus::Paid ? $fulfillmentAt : null,
            ],
        );

        $order->additionalItems()->delete();

        foreach ($itemNames as $itemName) {
            $item = $this->items[$itemName];
            $order->additionalItems()->create([
                'additional_item_id' => $item->id,
                'item_name_snapshot' => $item->name,
                'unit_snapshot' => $item->unit,
                'unit_price' => $item->price,
                'quantity' => 1,
                'subtotal' => $item->price,
            ]);
        }
    }
}
