<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds risk management fields to users table
     */
    public function up(): void
    {
        // Check if users table exists
        if (!Schema::hasTable('users')) {
            return;
        }

        // Add status column if it doesn't exist (for users who don't have it)
        if (!Schema::hasColumn('users', 'status')) {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('status', ['active', 'suspended', 'banned', 'pending_validation'])
                    ->default('active')
                    ->after('password');
            });
        }

        // Add risk_level column if it doesn't exist
        if (!Schema::hasColumn('users', 'risk_level')) {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('risk_level', ['normal', 'warning', 'red_zone'])
                    ->nullable()
                    ->default('normal')
                    ->after('status');
            });
        }

        // Add ban_reason column if it doesn't exist
        if (!Schema::hasColumn('users', 'ban_reason')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('ban_reason')->nullable()->after('risk_level');
                $table->timestamp('banned_at')->nullable()->after('ban_reason');
                $table->unsignedBigInteger('banned_by')->nullable()->after('banned_at');
            });
        }

        // Add suspension columns if they don't exist
        if (!Schema::hasColumn('users', 'suspended_until')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('suspended_until')->nullable()->after('banned_by');
                $table->text('suspension_reason')->nullable()->after('suspended_until');
            });
        }

        // Add disciplinary columns if they don't exist
        if (!Schema::hasColumn('users', 'warning_count')) {
            Schema::table('users', function (Blueprint $table) {
                $table->integer('warning_count')->default(0)->after('suspension_reason');
                $table->timestamp('last_warning_at')->nullable()->after('warning_count');
                $table->text('disciplinary_notes')->nullable()->after('last_warning_at');
            });
        }

        // Add return rate and complaint count if they don't exist
        if (!Schema::hasColumn('users', 'return_rate')) {
            Schema::table('users', function (Blueprint $table) {
                $table->decimal('return_rate', 5, 2)->default(0)->after('disciplinary_notes');
                $table->integer('complaint_count')->default(0)->after('return_rate');
                $table->integer('total_orders')->default(0)->after('complaint_count');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't drop columns in down() as it could cause data loss
        // These are important columns that should remain
    }
};
