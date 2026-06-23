<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\WhatsappStatus;
use App\Jobs\SendOrderWhatsappNotification;
use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\OrderSubmissionToken;
use App\Models\StoreSetting;
use App\Models\WhatsappLog;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PublicOrderService
{
    /** @param array<string, mixed> $data */
    public function create(array $data): Order
    {
        return DB::transaction(function () use ($data): Order {
            $token = OrderSubmissionToken::query()
                ->lockForUpdate()
                ->firstOrCreate(['token' => $data['submission_token']]);

            if ($token->order !== null) {
                return $token->order;
            }

            $setting = StoreSetting::query()->first() ?? new StoreSetting(StoreSetting::defaults());
            $method = FulfillmentMethod::from($data['fulfillment_method']);
            $fulfillmentAt = Carbon::parse(
                $data['fulfillment_at'],
                config('app.timezone'),
            );
            $this->validateFulfillment($fulfillmentAt, $setting);

            $size = CakeSize::query()->whereKey($data['cake_size_id'])->where('is_active', true)->firstOrFail();
            $shape = CakeShape::query()->whereKey($data['cake_shape_id'])->where('is_active', true)->firstOrFail();
            $phone = $this->normalizePhone($data['customer_phone']);
            $customer = Customer::query()->updateOrCreate(
                ['phone' => $phone],
                ['name' => $data['customer_name'], 'last_order_at' => now()],
            );
            $requested = collect($data['items'] ?? [])->keyBy('id');
            $items = AdditionalItem::query()
                ->whereIn('id', $requested->keys())
                ->where('is_active', true)
                ->get();

            if ($items->count() !== $requested->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Salah satu item tambahan tidak tersedia.',
                ]);
            }

            $cakePrice = $this->add($size->base_price, $shape->price_adjustment);
            $additionalTotal = $this->additionalTotal($items, $requested->all());
            $deliveryFee = $method->requiresAddress() ? (string) $setting->delivery_fee : '0.00';

            $order = Order::query()->create([
                'public_token' => (string) Str::ulid(),
                'order_number' => $this->nextOrderNumber(),
                'customer_id' => $customer->id,
                'cake_size_id' => $size->id,
                'cake_shape_id' => $shape->id,
                'source' => OrderSource::Public,
                'ordered_at' => now(),
                'fulfillment_at' => $fulfillmentAt,
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
                    'configuration' => $this->validateItemConfiguration($item, $requested[$item->id]['configuration'] ?? null),
                ]);
            }

            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'new_status' => OrderStatus::Pending->value,
            ]);
            $token->update(['order_id' => $order->id]);
            DB::afterCommit(fn () => $this->queueNotifications($order, $setting));

            return $order;
        });
    }

    public function normalizePhone(string $value): string
    {
        $phone = preg_replace('/\D+/', '', $value) ?? '';
        $phone = str_starts_with($phone, '0') ? '62'.substr($phone, 1) : $phone;

        if (! preg_match('/^62\d{8,13}$/', $phone)) {
            throw ValidationException::withMessages(['customer_phone' => 'Nomor WhatsApp tidak valid.']);
        }

        return $phone;
    }

    /** @param array<string, mixed>|null $configuration */
    private function validateItemConfiguration(AdditionalItem $item, ?array $configuration): ?array
    {
        if ($item->code !== 'candle') {
            return null;
        }

        $type = $configuration['type'] ?? null;
        if (! in_array($type, ['number', 'spiral'], true)) {
            throw ValidationException::withMessages(['items' => 'Pilih jenis lilin angka atau spiral.']);
        }

        $number = $configuration['number'] ?? null;
        if ($type === 'number' && (! is_string($number) || ! preg_match('/^\d+$/', $number))) {
            throw ValidationException::withMessages(['items' => 'Masukkan angka untuk lilin angka.']);
        }

        return $type === 'number'
            ? ['type' => 'number', 'number' => $number]
            : ['type' => 'spiral'];
    }

    /** @param array<int, AdditionalItem> $items */
    /** @param array<int, array<string, mixed>> $requested */
    private function additionalTotal(iterable $items, array $requested): string
    {
        $total = '0.00';

        foreach ($items as $item) {
            $total = $this->add($total, $this->multiply($item->price, (int) $requested[$item->id]['quantity']));
        }

        return $total;
    }

    private function queueNotifications(Order $order, StoreSetting $setting): void
    {
        $messages = [
            ['customer', $order->customer_name_snapshot, $order->customer_phone_snapshot, $this->render($setting->customer_order_template, $order)],
            ['admin', 'Admin Toko', $setting->admin_whatsapp, $this->render($setting->admin_order_template, $order)],
        ];

        foreach ($messages as [$recipientType, $recipientName, $phone, $message]) {
            $log = WhatsappLog::query()->create([
                'order_id' => $order->id,
                'recipient_type' => $recipientType,
                'message_type' => 'new_order',
                'recipient_name' => $recipientName,
                'phone' => $phone,
                'provider' => 'fonnte',
                'message' => $message,
                'status' => WhatsappStatus::Pending,
            ]);
            SendOrderWhatsappNotification::dispatch($log->id);
        }
    }

    private function render(string $template, Order $order): string
    {
        $date = $order->fulfillment_at->format('d M Y');
        $time = $order->fulfillment_at->format('H:i');

        return strtr($template, [
            '{name}' => $order->customer_name_snapshot,
            '{customer_name}' => $order->customer_name_snapshot,
            '{customer_phone}' => $order->customer_phone_snapshot,
            '{order_number}' => $order->order_number,
            '{fulfillment_date}' => $date,
            '{fulfillment_time}' => $time,
            '{pickup_date}' => $date,
            '{pickup_time}' => $time,
            '{pickup_at}' => $order->fulfillment_at->format('d M Y H:i'),
            '{fulfillment_method}' => $order->fulfillment_method->label(),
            '{delivery_address}' => $order->delivery_address ?? '-',
            '{grand_total}' => number_format((float) $order->grand_total, 0, ',', '.'),
            '{invoice_url}' => route('invoice.show', $order->public_token),
        ]);
    }

    private function validateFulfillment(Carbon $fulfillmentAt, StoreSetting $setting): void
    {
        $minimum = now()->addDays($setting->minimum_pickup_days)->startOfDay();

        if ($fulfillmentAt->lt($minimum)) {
            throw ValidationException::withMessages([
                'fulfillment_at' => sprintf(
                    'Jadwal paling cepat tersedia pada %s.',
                    $minimum->translatedFormat('d F Y'),
                ),
            ]);
        }

        $opening = Carbon::parse(
            $fulfillmentAt->toDateString().' '.$setting->opening_time,
            config('app.timezone'),
        );
        $closing = Carbon::parse(
            $fulfillmentAt->toDateString().' '.$setting->closing_time,
            config('app.timezone'),
        );

        if ($fulfillmentAt->betweenIncluded($opening, $closing)) {
            return;
        }

        throw ValidationException::withMessages([
            'fulfillment_at' => sprintf(
                'Jam pesanan tersedia pukul %s–%s.',
                $opening->format('H:i'),
                $closing->format('H:i'),
            ),
        ]);
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
