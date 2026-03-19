<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddStockManagement extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Stock alerts table
        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->integer('current_stock');
            $table->integer('threshold')->default(5);
            $table->string('status')->default('pending'); // pending, resolved
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index('supplier_id');
            $table->index('status');
        });

        // Products table updates
        Schema::table('products', function (Blueprint $table) {
            $table->integer('stock_minimum')->default(5)->after('stock');
            $table->boolean('auto_disable_out_of_stock')->default(true)->after('stock_minimum');
        });

        // Promotions/Coupons table
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('type'); // percentage, fixed
            $table->decimal('value', 10, 2);
            $table->decimal('min_order_amount', 10, 2)->nullable();
            $table->decimal('max_discount', 10, 2)->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->unsignedBigInteger('supplier_id')->nullable(); // null = platform-wide
            $table->unsignedBigInteger('product_id')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('code');
            $table->index('supplier_id');
            $table->index(['is_active', 'starts_at', 'expires_at']);
        });

        // Supplier wallet/commissions table
        Schema::create('supplier_wallets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id')->unique();
            $table->decimal('balance', 15, 2)->default(0);
            $table->decimal('pending_balance', 15, 2)->default(0);
            $table->decimal('total_earned', 15, 2)->default(0);
            $table->decimal('total_withdrawn', 15, 2)->default(0);
            $table->timestamps();
            
            $table->index('balance');
        });

        // Commission transactions
        Schema::create('commission_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('order_id');
            $table->decimal('order_amount', 15, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 15, 2);
            $table->decimal('supplier_amount', 15, 2);
            $table->string('status')->default('pending'); // pending, paid, cancelled
            $table->timestamps();
            
            $table->index('supplier_id');
            $table->index('order_id');
            $table->index('status');
        });

        // Withdrawals
        Schema::create('withdrawals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id');
            $table->decimal('amount', 15, 2);
            $table->string('method'); // mobile_money, bank
            $table->string('recipient_phone')->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending, approved, rejected, completed
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index('supplier_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('withdrawals');
        Schema::dropIfExists('commission_transactions');
        Schema::dropIfExists('supplier_wallets');
        Schema::dropIfExists('promotions');
        Schema::dropIfExists('stock_alerts');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock_minimum', 'auto_disable_out_of_stock']);
        });
    }
}
