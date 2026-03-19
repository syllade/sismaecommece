<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSecurityAndTrackingTables extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Campaign clicks for anti-fraud
        Schema::create('campaign_clicks', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('campaign_id');
            $table->string('click_id')->unique();
            $table->string('click_hash')->unique();
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->unsignedInteger('product_id')->nullable();
            $table->boolean('is_valid')->default(true);
            $table->boolean('is_suspicious')->default(false);
            $table->boolean('converted')->default(false);
            $table->decimal('conversion_amount', 10, 2)->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();

            $table->foreign('campaign_id')
                ->references('id')
                ->on('marketing_campaigns')
                ->onDelete('cascade');

            $table->index(['campaign_id', 'ip_address']);
            $table->index(['campaign_id', 'created_at']);
            $table->index(['click_id']);
        });

        // Supplier AI balances for billing
        Schema::create('supplier_ai_balances', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->decimal('balance', 10, 2)->default(0);
            $table->decimal('monthly_limit', 10, 2)->default(100); // Default 100 credits
            $table->decimal('monthly_used', 10, 2)->default(0);
            $table->integer('month')->default(date('m'));
            $table->integer('year')->default(date('Y'));
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->unique(['supplier_id', 'month', 'year']);
        });

        // Supplier activity logs for audit
        Schema::create('supplier_activity_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('action'); // create_product, update_order, etc.
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'created_at']);
            $table->index(['action', 'created_at']);
        });

        // Add missing indexes to orders table (only if columns exist)
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'supplier_id')) {
                $table->index(['supplier_id', 'status']);
                $table->index(['supplier_id', 'created_at']);
                $table->index(['supplier_id', 'payment_status']);
            }
            if (Schema::hasColumn('orders', 'delivery_person_id')) {
                $table->index(['delivery_person_id', 'status']);
            }
        });

        // Add missing indexes to products table (only if columns exist)
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'supplier_id')) {
                $table->index(['supplier_id', 'is_active']);
                $table->index(['supplier_id', 'status']);
                $table->index(['supplier_id', 'created_at']);
            }
            if (Schema::hasColumn('products', 'category_id')) {
                $table->index(['category_id', 'is_active']);
            }
        });

        // Add missing indexes to marketing_campaigns table (only if columns exist)
        Schema::table('marketing_campaigns', function (Blueprint $table) {
            if (Schema::hasColumn('marketing_campaigns', 'supplier_id')) {
                $table->index(['supplier_id', 'status']);
                $table->index(['supplier_id', 'created_at']);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'supplier_id')) {
                $table->dropIndex(['supplier_id', 'status']);
                $table->dropIndex(['supplier_id', 'created_at']);
                $table->dropIndex(['supplier_id', 'payment_status']);
            }
            if (Schema::hasColumn('orders', 'delivery_person_id')) {
                $table->dropIndex(['delivery_person_id', 'status']);
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'supplier_id')) {
                $table->dropIndex(['supplier_id', 'is_active']);
                $table->dropIndex(['supplier_id', 'status']);
                $table->dropIndex(['supplier_id', 'created_at']);
            }
            if (Schema::hasColumn('products', 'category_id')) {
                $table->dropIndex(['category_id', 'is_active']);
            }
        });

        Schema::table('marketing_campaigns', function (Blueprint $table) {
            if (Schema::hasColumn('marketing_campaigns', 'supplier_id')) {
                $table->dropIndex(['supplier_id', 'status']);
                $table->dropIndex(['supplier_id', 'created_at']);
            }
        });

        Schema::dropIfExists('supplier_activity_logs');
        Schema::dropIfExists('supplier_ai_balances');
        Schema::dropIfExists('campaign_clicks');
    }
}
