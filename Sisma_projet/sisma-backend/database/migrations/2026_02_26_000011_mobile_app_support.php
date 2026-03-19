<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class MobileAppSupport extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Mobile devices for push notifications
        Schema::create('mobile_devices', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('user_type'); // supplier, driver, admin
            $table->string('device_id'); // UUID from device
            $table->string('device_type'); // android, ios
            $table->text('fcm_token')->nullable(); // Firebase token
            $table->string('device_name')->nullable();
            $table->string('app_version')->nullable();
            $table->string('os_version')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'user_type', 'device_id']);
            $table->index(['user_id', 'user_type', 'is_active']);
        });

        // Refresh tokens for mobile JWT
        Schema::create('mobile_refresh_tokens', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('user_type');
            $table->string('token', 64); // SHA256 hash
            $table->string('device_id')->nullable();
            $table->string('device_name')->nullable();
            $table->timestamp('expires_at');
            $table->boolean('is_revoked')->default(false);
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'user_type', 'is_revoked']);
            $table->index('expires_at');
        });

        // Push notification logs
        Schema::create('push_notifications_log', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id')->nullable();
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->integer('tokens_count')->default(0);
            $table->integer('success_count')->default(0);
            $table->integer('failure_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        // Add subscription fields to suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('subscription_plan')->default('free')->after('data_retention_days');
            $table->string('subscription_status')->default('active')->after('subscription_plan');
            $table->timestamp('subscription_start')->nullable()->after('subscription_status');
            $table->timestamp('subscription_end')->nullable()->after('subscription_start');
            $table->boolean('subscription_auto_renew')->default(true)->after('subscription_end');
            $table->timestamp('cancelled_at')->nullable()->after('subscription_auto_renew');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_plan',
                'subscription_status',
                'subscription_start',
                'subscription_end',
                'subscription_auto_renew',
                'cancelled_at',
            ]);
        });

        Schema::dropIfExists('push_notifications_log');
        Schema::dropIfExists('mobile_refresh_tokens');
        Schema::dropIfExists('mobile_devices');
    }
}
