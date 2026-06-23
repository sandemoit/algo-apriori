<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CheckOrderRequest;
use App\Http\Requests\StorePublicOrderRequest;
use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Services\PublicOrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicOrderController extends Controller
{
    public function create(): Response
    {
        $settings = StoreSetting::query()->first() ?? new StoreSetting(StoreSetting::defaults());

        return Inertia::render('public/create-order', [
            'sizes' => CakeSize::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'shapes' => CakeShape::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'items' => AdditionalItem::query()->where('is_active', true)->orderBy('sort_order')->get(),
            'settings' => $settings,
        ]);
    }

    public function store(StorePublicOrderRequest $request, PublicOrderService $service): RedirectResponse
    {
        $order = $service->create($request->validated());

        return to_route('invoice.show', $order->public_token);
    }

    public function invoice(string $publicToken): Response
    {
        $order = Order::query()->with('additionalItems')->where('public_token', $publicToken)->firstOrFail();

        return Inertia::render('public/invoice', ['order' => $order, 'maskedPhone' => substr($order->customer_phone_snapshot, 0, 4).'****'.substr($order->customer_phone_snapshot, -4)]);
    }

    public function check(CheckOrderRequest $request, PublicOrderService $service): RedirectResponse
    {
        $phone = $service->normalizePhone($request->validated('phone'));
        $order = Order::query()->where('order_number', $request->validated('order_number'))->where('customer_phone_snapshot', $phone)->first();
        if ($order === null) {
            return back()->withErrors(['order_number' => 'Data pesanan tidak ditemukan.']);
        }

        return to_route('invoice.show', $order->public_token);
    }

    public function referenceImage(Request $request, string $publicToken)
    {
        $order = Order::query()->where('public_token', $publicToken)->firstOrFail();
        abort_unless($order->reference_image_path && Storage::disk('local')->exists($order->reference_image_path), 404);

        return Storage::disk('local')->response($order->reference_image_path);
    }
}
