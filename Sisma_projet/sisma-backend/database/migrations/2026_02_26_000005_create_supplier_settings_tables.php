<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSupplierSettingsTables extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Supplier settings
        Schema::create('supplier_settings', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('key');
            $table->text('value')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->unique(['supplier_id', 'key']);
            $table->index(['supplier_id', 'key']);
        });

        // Supplier API keys
        Schema::create('supplier_api_keys', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('name');
            $table->string('key_hash');
            $table->string('prefix', 20);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->unique(['supplier_id', 'key_hash']);
        });

        // Supplier payments
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->decimal('amount', 10, 2);
            $table->string('type'); // deposit, withdrawal, commission, refund
            $table->string('status'); // pending, completed, failed
            $table->string('payment_method')->nullable();
            $table->string('transaction_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'created_at']);
        });

        // AI usage logs
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('action');
            $table->json('metadata')->nullable();
            $table->integer('tokens_used')->default(0);
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'created_at']);
        });

        // Order status logs
        Schema::create('order_status_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('order_id');
            $table->string('old_status')->nullable();
            $table->string('new_status');
            $table->unsignedInteger('changed_by')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('order_id')
                ->references('id')
                ->on('orders')
                ->onDelete('cascade');

            $table->index(['order_id', 'created_at']);
        });

        // Marketing campaign stats
        Schema::create('marketing_campaign_stats', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('campaign_id');
            $table->date('date');
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('conversions')->default(0);
            $table->decimal('spent', 10, 2)->default(0);
            $table->timestamps();

            $table->foreign('campaign_id')
                ->references('id')
                ->on('marketing_campaigns')
                ->onDelete('cascade');

            $table->unique(['campaign_id', 'date']);
            $table->index(['campaign_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('marketing_campaign_stats');
        Schema::dropIfExists('order_status_logs');
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('supplier_api_keys');
        Schema::dropIfExists('supplier_settings');
    }
}
