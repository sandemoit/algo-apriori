<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('apriori_analysis_runs', function (Blueprint $table): void {
            $table->unsignedSmallInteger('maximum_rules')->default(100)->after('maximum_itemset');
            $table->unsignedInteger('minimum_occurrence')->default(2)->after('maximum_rules');
            $table->string('sort_by')->default('lift')->after('minimum_occurrence');
            $table->unsignedInteger('frequent_itemset_count')->default(0)->after('unique_item_count');
            $table->unsignedInteger('execution_time_ms')->nullable()->after('rule_count');
            $table->string('status')->default('completed')->after('execution_time_ms')->index();
            $table->text('error_message')->nullable()->after('status');
            $table->timestamp('started_at')->nullable()->after('error_message');
            $table->timestamp('completed_at')->nullable()->after('started_at');
        });

        Schema::create('apriori_itemsets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('analysis_run_id')->constrained('apriori_analysis_runs')->cascadeOnDelete();
            $table->unsignedSmallInteger('item_count');
            $table->decimal('support', 8, 6);
            $table->unsignedInteger('support_count');
            $table->timestamps();
            $table->index(['analysis_run_id', 'support']);
        });

        Schema::create('apriori_itemset_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('apriori_itemset_id')->constrained('apriori_itemsets')->cascadeOnDelete();
            $table->foreignId('additional_item_id')->constrained()->restrictOnDelete();
            $table->timestamps();
            $table->unique(['apriori_itemset_id', 'additional_item_id'], 'apriori_itemset_item_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apriori_itemset_items');
        Schema::dropIfExists('apriori_itemsets');

        Schema::table('apriori_analysis_runs', function (Blueprint $table): void {
            $table->dropColumn([
                'maximum_rules',
                'minimum_occurrence',
                'sort_by',
                'frequent_itemset_count',
                'execution_time_ms',
                'status',
                'error_message',
                'started_at',
                'completed_at',
            ]);
        });
    }
};
