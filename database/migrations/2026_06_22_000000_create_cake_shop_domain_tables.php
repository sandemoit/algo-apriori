<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('phone', 20)->unique();
            $table->timestamp('last_order_at')->nullable();
            $table->timestamps();
            $table->index('name');
        });

        Schema::create('cake_sizes', fn (Blueprint $table) => $this->catalog($table));

        Schema::create('cake_shapes', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->decimal('price_adjustment', 12, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('additional_items', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->nullable()->unique();
            $table->string('name');
            $table->decimal('price', 12, 2)->default(0);
            $table->string('unit')->default('pcs');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('store_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('store_name');
            $table->string('store_phone');
            $table->string('admin_whatsapp');
            $table->text('store_address')->nullable();
            $table->string('logo_path')->nullable();
            $table->text('customer_order_template');
            $table->text('admin_order_template');
            $table->boolean('public_order_enabled')->default(true);
            $table->unsignedSmallInteger('minimum_pickup_days')->default(1);
            $table->time('opening_time');
            $table->time('closing_time');
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->ulid('public_token')->unique();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained()->restrictOnDelete();
            $table->foreignId('cake_size_id')->constrained();
            $table->foreignId('cake_shape_id')->constrained();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source')->index();
            $table->dateTime('ordered_at')->index();
            $table->dateTime('fulfillment_at')->index();
            $table->string('fulfillment_method')->default('pickup');
            $table->string('customer_name_snapshot');
            $table->string('customer_phone_snapshot', 20);
            $table->text('delivery_address')->nullable();
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->string('cake_size_snapshot');
            $table->string('cake_shape_snapshot');
            $table->string('cake_text')->nullable();
            $table->string('age_text')->nullable();
            $table->string('base_color')->nullable();
            $table->string('decoration_color')->nullable();
            $table->string('character_theme')->nullable();
            $table->string('reference_image_path')->nullable();
            $table->decimal('cake_price', 12, 2);
            $table->decimal('additional_items_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2);
            $table->string('status')->index();
            $table->string('payment_status')->default('unpaid')->index();
            $table->text('customer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'fulfillment_at']);
        });

        Schema::create('order_submission_tokens', function (Blueprint $table): void {
            $table->id();
            $table->uuid('token')->unique();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('order_additional_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('additional_item_id')->constrained()->restrictOnDelete();
            $table->string('item_name_snapshot');
            $table->string('unit_snapshot');
            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('subtotal', 12, 2);
            $table->json('configuration')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'additional_item_id']);
        });

        Schema::create('whatsapp_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('recipient_type')->index();
            $table->string('message_type');
            $table->string('recipient_name');
            $table->string('phone', 20);
            $table->string('provider');
            $table->text('message');
            $table->string('status')->index();
            $table->string('provider_message_id')->nullable();
            $table->json('provider_response')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('failed_at')->nullable();
            $table->timestamps();
            $table->index(['order_id', 'recipient_type']);
        });

        Schema::create('order_status_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('previous_status')->nullable();
            $table->string('new_status');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('apriori_analysis_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('executed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date_from');
            $table->date('date_to');
            $table->decimal('minimum_support', 8, 6);
            $table->decimal('minimum_confidence', 8, 6);
            $table->decimal('minimum_lift', 8, 6)->default(0);
            $table->unsignedSmallInteger('maximum_itemset')->default(3);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->unsignedInteger('unique_item_count')->default(0);
            $table->unsignedInteger('rule_count')->default(0);
            $table->timestamp('executed_at');
            $table->timestamps();
        });

        Schema::create('apriori_rules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('apriori_analysis_runs')->cascadeOnDelete();
            $table->decimal('support', 8, 6);
            $table->decimal('confidence', 8, 6);
            $table->decimal('lift', 12, 6);
            $table->unsignedInteger('support_count');
            $table->timestamps();
            $table->index('analysis_run_id');
        });

        Schema::create('apriori_rule_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('apriori_rule_id')->constrained('apriori_rules')->cascadeOnDelete();
            $table->foreignId('additional_item_id')->constrained()->restrictOnDelete();
            $table->string('side');
            $table->timestamps();
            $table->index(['additional_item_id', 'side']);
        });
    }

    private function catalog(Blueprint $table): void
    {
        $table->id();
        $table->string('name');
        $table->decimal('base_price', 12, 2)->default(0);
        $table->boolean('is_active')->default(true);
        $table->unsignedSmallInteger('sort_order')->default(0);
        $table->timestamps();
    }

    public function down(): void
    {
        foreach ([
            'apriori_rule_items',
            'apriori_rules',
            'apriori_analysis_runs',
            'order_status_histories',
            'whatsapp_logs',
            'order_additional_items',
            'order_submission_tokens',
            'orders',
            'store_settings',
            'additional_items',
            'cake_shapes',
            'cake_sizes',
            'customers',
        ] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
