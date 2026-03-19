<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ZeroTrustSecurity extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        // Trusted devices
        Schema::create('supplier_trusted_devices', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('fingerprint', 64);
            $table->string('device_name')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->boolean('is_revoked')->default(false);
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->unique(['supplier_id', 'fingerprint']);
            $table->index(['supplier_id', 'is_revoked']);
        });

        // IP Whitelist
        Schema::create('supplier_ip_whitelist', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('ip_address', 45); // Support IPv4 and IPv6
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->unique(['supplier_id', 'ip_address']);
        });

        // Login logs
        Schema::create('supplier_login_logs', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('device_fingerprint', 64)->nullable();
            $table->string('ip_address', 45);
            $table->string('user_agent')->nullable();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('location')->nullable(); // Country/City from IP
            $table->boolean('is_successful')->default(true);
            $table->string('failure_reason')->nullable();
            $table->boolean('is_suspicious')->default(false);
            $table->string('suspicious_reason')->nullable();
            $table->boolean('two_factor_verified')->default(false);
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'created_at']);
            $table->index(['ip_address', 'created_at']);
        });

        // Security events
        Schema::create('supplier_security_events', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('supplier_id');
            $table->string('event'); // 2fa_enabled, 2fa_disabled, device_trusted, device_revoked, etc.
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->onDelete('cascade');

            $table->index(['supplier_id', 'event']);
            $table->index(['supplier_id', 'created_at']);
        });

        // Events store for event sourcing fallback
        Schema::create('events_store', function (Blueprint $table) {
            $table->increments('id');
            $table->string('stream');
            $table->string('event_type');
            $table->string('aggregate_type')->nullable();
            $table->unsignedInteger('aggregate_id')->nullable();
            $table->json('data');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');

            $table->index(['stream', 'created_at']);
            $table->index(['aggregate_type', 'aggregate_id']);
        });

        // Add 2FA fields to suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')->default(false)->after('advertising_balance');
            $table->text('two_factor_secret')->nullable()->after('two_factor_enabled');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_disabled_at')->nullable()->after('two_factor_confirmed_at');
        });

        // Add fields to users for 2FA
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'two_factor_enabled')) {
                $table->boolean('two_factor_enabled')->default(false);
                $table->text('two_factor_secret')->nullable();
                $table->string('phone')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_enabled', 'two_factor_secret']);
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled', 
                'two_factor_secret', 
                'two_factor_confirmed_at', 
                'two_factor_disabled_at'
            ]);
        });

        Schema::dropIfExists('events_store');
        Schema::dropIfExists('supplier_security_events');
        Schema::dropIfExists('supplier_login_logs');
        Schema::dropIfExists('supplier_ip_whitelist');
        Schema::dropIfExists('supplier_trusted_devices');
    }
}
