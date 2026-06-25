<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdditionalItem;
use App\Models\CakeShape;
use App\Models\CakeSize;
use App\Models\StoreSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    public function index(): Response
    {
        $settings = StoreSetting::query()->first() ?? new StoreSetting(StoreSetting::defaults());
        $logoPath = $settings->logo_path;

        return Inertia::render('admin/settings', ['sizes' => CakeSize::query()->orderBy('sort_order')->get(), 'shapes' => CakeShape::query()->orderBy('sort_order')->get(), 'items' => AdditionalItem::query()->orderBy('sort_order')->get(), 'settings' => [...$settings->toArray(), 'logo_url' => $logoPath ? Storage::disk('public')->url($logoPath) : null]]);
    }

    public function store(Request $request, string $resource): RedirectResponse
    {
        $model = $this->model($resource);
        $model::query()->create($this->validated($request, $resource));

        return back()->with('success', 'Master data ditambahkan.');
    }

    public function update(Request $request, string $resource, int $id): RedirectResponse
    {
        $model = $this->model($resource);
        $model::query()->findOrFail($id)->update($this->validated($request, $resource));

        return back()->with('success', 'Master data diperbarui.');
    }

    public function deactivate(string $resource, int $id): RedirectResponse
    {
        $model = $this->model($resource);
        $model::query()->findOrFail($id)->update(['is_active' => false]);

        return back()->with('success', 'Master data dinonaktifkan.');
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $data = $request->validate(['store_name' => ['required', 'string', 'max:100'], 'store_phone' => ['required', 'string', 'max:20'], 'admin_whatsapp' => ['required', 'string', 'max:20'], 'store_address' => ['nullable', 'string'], 'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'], 'customer_order_template' => ['required', 'string'], 'admin_order_template' => ['required', 'string'], 'public_order_enabled' => ['boolean'], 'minimum_pickup_days' => ['required', 'integer', 'min:0', 'max:30'], 'opening_time' => ['required', 'date_format:H:i'], 'closing_time' => ['required', 'date_format:H:i'], 'delivery_fee' => ['required', 'numeric', 'min:0']]);
        unset($data['logo']);

        $settings = StoreSetting::query()->firstOrCreate([], StoreSetting::defaults());
        if ($request->hasFile('logo')) {
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }

            $data['logo_path'] = $request->file('logo')->store('store-logos', 'public');
        }

        $settings->update($data);

        return back()->with('success', 'Pengaturan toko diperbarui.');
    }

    /** @return class-string */
    private function model(string $resource): string
    {
        return match ($resource) {
            'sizes' => CakeSize::class, 'shapes' => CakeShape::class, 'items' => AdditionalItem::class, default => abort(404)
        };
    }

    /** @return array<string,mixed> */
    private function validated(Request $request, string $resource): array
    {
        return match ($resource) {
            'sizes' => $request->validate(['name' => ['required', 'string', 'max:50'], 'base_price' => ['required', 'numeric', 'min:0'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0']]), 'shapes' => $request->validate(['name' => ['required', 'string', 'max:50'], 'price_adjustment' => ['required', 'numeric', 'min:0'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0']]), 'items' => $request->validate(['name' => ['required', 'string', 'max:50'], 'price' => ['required', 'numeric', 'min:0'], 'unit' => ['required', 'string', 'max:20'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0']])
        };
    }
}
