<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::query()->with('customer:id,name,phone')->when($request->filled('search'), fn ($q) => $q->where(fn ($s) => $s->where('order_number', 'like', '%'.$request->string('search').'%')->orWhere('customer_name_snapshot', 'like', '%'.$request->string('search').'%')))->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))->latest('fulfillment_at')->paginate(20)->withQueryString();

        return Inertia::render('admin/orders', ['orders' => $orders, 'filters' => $request->only('search', 'status')]);
    }

    public function store(StoreOrderRequest $request, OrderService $service): RedirectResponse
    {
        $order = $service->create($request->validated(), $request->user()->id);

        return to_route('admin.orders.show', $order)->with('success', 'Order berhasil dibuat.');
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/order-detail', ['order' => $order->load(['additionalItems', 'whatsappLogs', 'statusHistories', 'completedBy:id,name', 'paidBy:id,name'])]);
    }

    public function complete(Request $request, Order $order, OrderService $service): RedirectResponse
    {
        $service->complete($order, $request->user()->id);

        return back()->with('success', 'Order ditandai selesai dan pembayaran dikonfirmasi lunas.');
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();

        return to_route('admin.orders.index')->with('success', 'Order dihapus.');
    }
}
