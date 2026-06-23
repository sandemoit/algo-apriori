<?php

use App\Http\Controllers\Admin\AprioriController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MasterDataController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\OrderIndexController;
use App\Http\Controllers\Admin\WhatsappLogController;
use App\Http\Controllers\PublicOrderController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'public/home')->name('home');
Route::get('/order', [PublicOrderController::class, 'create'])->name('order');
Route::post('/order', [PublicOrderController::class, 'store'])->middleware('throttle:5,10')->name('order.store');
Route::post('/cek-order', [PublicOrderController::class, 'check'])->middleware('throttle:5,10')->name('check-order.store');
Route::inertia('/cek-order', 'public/check-order-form')->name('check-order');
Route::get('/invoice/{publicToken}', [PublicOrderController::class, 'invoice'])->name('invoice.show');
Route::get('/invoice/{publicToken}/reference-image', [PublicOrderController::class, 'referenceImage'])->name('invoice.reference-image');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('admin/dashboard', DashboardController::class)->name('dashboard');
    Route::get('admin/orders', OrderIndexController::class)->name('admin.orders.index');
    Route::post('admin/orders', [OrderController::class, 'store'])->name('admin.orders.store');
    Route::get('admin/orders/{order}', [OrderController::class, 'show'])->name('admin.orders.show');
    Route::patch('admin/orders/{order}/complete', [OrderController::class, 'complete'])->name('admin.orders.complete');
    Route::delete('admin/orders/{order}', [OrderController::class, 'destroy'])->name('admin.orders.destroy');
    Route::get('admin/reports', [AprioriController::class, 'index'])->name('admin.reports');
    Route::post('admin/apriori', [AprioriController::class, 'store'])->name('admin.apriori.store');
    Route::get('admin/apriori/{aprioriAnalysisRun}', [AprioriController::class, 'show'])->name('admin.apriori.show');
    Route::post('admin/apriori/{aprioriAnalysisRun}/rerun', [AprioriController::class, 'rerun'])->name('admin.apriori.rerun');
    Route::delete('admin/apriori/{aprioriAnalysisRun}', [AprioriController::class, 'destroy'])->name('admin.apriori.destroy');
    Route::get('admin/reports/export', [AprioriController::class, 'export'])->name('admin.reports.export');
    Route::get('admin/settings', [MasterDataController::class, 'index'])->name('admin.settings');
    Route::put('admin/settings', [MasterDataController::class, 'updateSettings'])->name('admin.settings.update');
    Route::post('admin/master/{resource}', [MasterDataController::class, 'store'])->name('admin.master.store');
    Route::put('admin/master/{resource}/{id}', [MasterDataController::class, 'update'])->name('admin.master.update');
    Route::delete('admin/master/{resource}/{id}', [MasterDataController::class, 'deactivate'])->name('admin.master.deactivate');
    Route::post('admin/orders/{order}/whatsapp/resend', [WhatsappLogController::class, 'resend'])->name('admin.orders.whatsapp.resend');
});

require __DIR__.'/settings.php';
