<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\StoreSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    /** @param array<string, mixed> $data */
    public function create(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId): Order {
            $method = FulfillmentMethod::from($data['fulfillment_method']);
            $setting = StoreSetting::query()->firstOrFail();
            $phone = $this->normalizePhone($data['customer_phone']);
            $customer = Customer::query()->updateOrCreate(
                ['phone' => $phone],
                ['name' => $data['customer_name'], 'last_order_at' => now()],
            );
            $size = CakeSize::query()->whereKey($data['cake_size_id'])->where('is_active', true)->firstOrFail();
            $shape = CakeShape::query()->whereKey($data['cake_shape_id'])->where('is_active', true)->firstOrFail();
            $requested = collect($data['items'] ?? [])->keyBy('id');
            $items = AdditionalItem::query()
                ->whereIn('id', $requested->keys())
                ->where('is_active', true)
                ->get();

            if ($items->count() !== $requested->count()) {
                throw ValidationException::withMessages(['items' => 'Item tambahan tidak tersedia.']);
            }

            $cakePrice = $this->add($size->base_price, $shape->price_adjustment);
            $additionalTotal = '0.00';
            foreach ($items as $item) {
                $additionalTotal = $this->add(
                    $additionalTotal,
                    $this->multiply($item->price, (int) $requested[$item->id]['quantity']),
                );
            }

            $deliveryFee = $method->requiresAddress() ? (string) $setting->delivery_fee : '0.00';
            $order = Order::query()->create([
                'public_token' => (string) Str::ulid(),
                'order_number' => $this->nextOrderNumber(),
                'customer_id' => $customer->id,
                'cake_size_id' => $size->id,
                'cake_shape_id' => $shape->id,
                'created_by' => $userId,
                'source' => OrderSource::Admin,
                'ordered_at' => now(),
                'fulfillment_at' => $data['fulfillment_at'],
                'fulfillment_method' => $method,
                'customer_name_snapshot' => $customer->name,
                'customer_phone_snapshot' => $phone,
                'delivery_address' => $method->requiresAddress() ? trim((string) $data['delivery_address']) : null,
                'delivery_fee' => $deliveryFee,
                'cake_size_snapshot' => $size->name,
                'cake_shape_snapshot' => $shape->name,
                'cake_text' => $data['cake_text'] ?? null,
                'age_text' => $data['age_text'] ?? null,
                'base_color' => $data['base_color'] ?? null,
                'decoration_color' => $data['decoration_color'] ?? null,
                'character_theme' => $data['character_theme'] ?? null,
                'reference_image_path' => $this->storeReferenceImage($data['reference_image'] ?? null),
                'cake_price' => $cakePrice,
                'additional_items_total' => $additionalTotal,
                'grand_total' => $this->add($cakePrice, $additionalTotal, $deliveryFee),
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'customer_notes' => $data['customer_notes'] ?? null,
                'admin_notes' => $data['admin_notes'] ?? null,
            ]);

            foreach ($items as $item) {
                $quantity = (int) $requested[$item->id]['quantity'];
                $order->additionalItems()->create([
                    'additional_item_id' => $item->id,
                    'item_name_snapshot' => $item->name,
                    'unit_snapshot' => $item->unit,
                    'unit_price' => $item->price,
                    'quantity' => $quantity,
                    'subtotal' => $this->multiply($item->price, $quantity),
                ]);
            }

            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'changed_by' => $userId,
                'new_status' => OrderStatus::Pending->value,
            ]);

            return $order;
        });
    }

    public function complete(Order $order, int $userId): void
    {
        if ($order->status === OrderStatus::Completed) {
            return;
        }

        DB::transaction(function () use ($order, $userId): void {
            $order->refresh();
            if ($order->status === OrderStatus::Completed) {
                return;
            }

            $previous = $order->status;
            $now = now();
            $order->update([
                'status' => OrderStatus::Completed,
                'completed_at' => $now,
                'completed_by' => $userId,
                'payment_status' => PaymentStatus::Paid,
                'paid_at' => $now,
                'paid_by' => $userId,
            ]);
            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'changed_by' => $userId,
                'previous_status' => $previous->value,
                'new_status' => OrderStatus::Completed->value,
                'notes' => 'Pembayaran dikonfirmasi lunas.',
            ]);
        });
    }

    private function normalizePhone(string $value): string
    {
        $phone = preg_replace('/\D+/', '', $value) ?? '';
        $phone = str_starts_with($phone, '0') ? '62'.substr($phone, 1) : $phone;

        if (! preg_match('/^62\d{8,13}$/', $phone)) {
            throw ValidationException::withMessages(['customer_phone' => 'Nomor WhatsApp tidak valid.']);
        }

        return $phone;
    }

    private function nextOrderNumber(): string
    {
        $sequence = Order::query()
            ->withTrashed()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->lockForUpdate()
            ->count() + 1;

        return sprintf('ORD-%s-%04d', now()->format('Ym'), $sequence);
    }

    private function storeReferenceImage(?UploadedFile $file): ?string
    {
        return $file?->store('order-references', 'local');
    }

    private function cents(string|int|float $value): int
    {
        return (int) round(((float) $value) * 100);
    }

    private function decimal(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }

    private function add(string|int|float ...$values): string
    {
        return $this->decimal(array_sum(array_map($this->cents(...), $values)));
    }

    private function multiply(string|int|float $value, int $factor): string
    {
        return $this->decimal($this->cents($value) * $factor);
    }
}
