<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FulfillmentMethod;
use App\Enums\OrderSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'ordered_at' => 'datetime',
            'fulfillment_at' => 'datetime',
            'completed_at' => 'datetime',
            'paid_at' => 'datetime',
            'status' => OrderStatus::class,
            'source' => OrderSource::class,
            'fulfillment_method' => FulfillmentMethod::class,
            'payment_status' => PaymentStatus::class,
            'delivery_fee' => 'decimal:2',
            'cake_price' => 'decimal:2',
            'additional_items_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function additionalItems(): HasMany
    {
        return $this->hasMany(OrderAdditionalItem::class);
    }

    public function whatsappLogs(): HasMany
    {
        return $this->hasMany(WhatsappLog::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
