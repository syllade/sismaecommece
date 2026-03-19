<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class ExpandUserRolesAndInvitationFields extends Migration
{
    public function up()
    {
        // Étendre l'enum role pour supporter admin/supplier/delivery/client.
        try {
            // First drop the existing enum if it exists
            DB::statement("ALTER TABLE users MODIFY role ENUM('super_admin','admin','supplier','delivery','client','user') NOT NULL DEFAULT 'client'");
            DB::statement("UPDATE users SET role='client' WHERE role='user' OR role IS NULL");
        } catch (\Exception $e) {
            // Fallback pour bases n'ayant pas l'enum role ou déjà migrées.
            \Log::warning('Migration role users: ' . $e->getMessage());
        }

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'supplier_id')) {
                $table->integer('supplier_id')->unsigned()->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('users', 'delivery_person_id')) {
                $table->integer('delivery_person_id')->unsigned()->nullable()->after('supplier_id');
            }
            if (!Schema::hasColumn('users', 'activation_token')) {
                $table->string('activation_token', 120)->nullable()->after('delivery_person_id');
            }
            if (!Schema::hasColumn('users', 'activation_token_expires_at')) {
                $table->dateTime('activation_token_expires_at')->nullable()->after('activation_token');
            }
            if (!Schema::hasColumn('users', 'password_set_at')) {
                $table->dateTime('password_set_at')->nullable()->after('activation_token_expires_at');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'password_set_at')) {
                $table->dropColumn('password_set_at');
            }
            if (Schema::hasColumn('users', 'activation_token_expires_at')) {
                $table->dropColumn('activation_token_expires_at');
            }
            if (Schema::hasColumn('users', 'activation_token')) {
                $table->dropColumn('activation_token');
            }
            if (Schema::hasColumn('users', 'delivery_person_id')) {
                $table->dropColumn('delivery_person_id');
            }
            if (Schema::hasColumn('users', 'supplier_id')) {
                $table->dropColumn('supplier_id');
            }
        });
    }
}
