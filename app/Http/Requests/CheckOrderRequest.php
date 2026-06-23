<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['order_number' => ['required', 'string', 'max:40'], 'phone' => ['required', 'string', 'max:20']];
    }
}
