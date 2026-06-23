<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\FulfillmentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'fulfillment_method' => ['required', Rule::enum(FulfillmentMethod::class)],
            'fulfillment_at' => ['required', 'date', 'after:now'],
            'delivery_address' => ['nullable', 'required_unless:fulfillment_method,pickup', 'string', 'max:2000'],
            'cake_size_id' => ['required', 'exists:cake_sizes,id'],
            'cake_shape_id' => ['required', 'exists:cake_shapes,id'],
            'cake_text' => ['nullable', 'string', 'max:120'],
            'age_text' => ['nullable', 'string', 'max:30'],
            'base_color' => ['nullable', 'string', 'max:60'],
            'decoration_color' => ['nullable', 'string', 'max:60'],
            'character_theme' => ['nullable', 'string', 'max:120'],
            'reference_image' => ['nullable', 'image', 'max:5120'],
            'customer_notes' => ['nullable', 'string', 'max:2000'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['array'],
            'items.*.id' => ['required', 'integer', 'distinct', 'exists:additional_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }
}
