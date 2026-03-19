<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ActivityAndAiLogs extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Supplier activity logs
        Schema::create('supplier_activity_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('action'); // login, logout, order_created, product_updated, etc.
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'action']);
            $table->index(['supplier_id', 'created_at']);
        });

        // Supplier AI balances
        Schema::create('supplier_ai_balances', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id')->unique();
            $table->decimal('credits', 12, 2)->default(100); // Free credits
            $table->decimal('spent', 12, 2)->default(0);
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');
        });

        // Supplier AI usage logs
        Schema::create('supplier_ai_usage_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('feature'); // billing, product_description, seo_optimization, etc.
            $table->integer('tokens_used')->default(0);
            $table->decimal('cost', 10, 4)->default(0);
            $table->text('prompt')->nullable();
            $table->text('response')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'feature']);
            $table->index(['supplier_id', 'created_at']);
        });

        // Add supplier_id to marketing_campaigns if not exists
        Schema::table('marketing_campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('marketing_campaigns', 'supplier_id')) {
                $table->unsignedInteger('supplier_id')->after('id');
                $table->foreign('supplier_id')
                    ->references('id')
                    ->on('suppliers')
                    ->onDelete('cascade');
            }
        });

        // Campaign clicks tracking
        Schema::create('campaign_clicks', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('campaign_id');
            $table->string('ip_address', 45);
            $table->string('user_agent')->nullable();
            $table->string('referer')->nullable();
            $table->decimal('cost', 10, 4)->default(0);
            $table->boolean('is_suspicious')->default(false);
            $table->string('suspicious_reason')->nullable();
            $table->timestamps();

            $table->foreign('campaign_id')
                ->references('id')
                ->on('marketing_campaigns')
                ->onDelete('cascade');

            $table->index(['campaign_id', 'created_at']);
            $table->index(['ip_address', 'campaign_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('campaign_clicks');

        Schema::table('marketing_campaigns', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn('supplier_id');
        });

        Schema::dropIfExists('supplier_ai_usage_logs');
        Schema::dropIfExists('supplier_ai_balances');
        Schema::dropIfExists('supplier_activity_logs');
    }
}
