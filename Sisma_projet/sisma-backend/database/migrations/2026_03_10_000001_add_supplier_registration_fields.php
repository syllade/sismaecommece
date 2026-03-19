<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSupplierRegistrationFields extends Migration
{
    public function up()
    {
        // Add missing columns to suppliers table
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'rccm')) {
                $table->string('rccm', 50)->nullable()->after('name');
            }
            if (!Schema::hasColumn('suppliers', 'nif')) {
                $table->string('nif', 50)->nullable()->after('rccm');
            }
            if (!Schema::hasColumn('suppliers', 'city')) {
                $table->string('city', 100)->nullable()->after('nif');
            }
            if (!Schema::hasColumn('suppliers', 'country')) {
                $table->string('country', 100)->nullable()->after('city');
            }
            if (!Schema::hasColumn('suppliers', 'description')) {
                $table->text('description')->nullable()->after('country');
            }
            if (!Schema::hasColumn('suppliers', 'status')) {
                $table->string('status', 50)->default('pending_validation')->after('description');
            }
            if (!Schema::hasColumn('suppliers', 'primary_category_id')) {
                $table->unsignedBigInteger('primary_category_id')->nullable()->after('status');
            }
        });

        // Create supplier_categories pivot table if it doesn't exist
        if (!Schema::hasTable('supplier_categories')) {
            Schema::create('supplier_categories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('supplier_id');
                $table->unsignedBigInteger('category_id');
                $table->timestamps();

                $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('cascade');
                $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
                $table->unique(['supplier_id', 'category_id']);
            });
        }

        // Add missing columns to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 100)->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 100)->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 20)->nullable()->after('last_name');
            }
        });
    }

    public function down()
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn([
                'rccm', 'nif', 'city', 'country', 'description', 'status', 'primary_category_id'
            ]);
        });

        Schema::dropIfExists('supplier_categories');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'phone']);
        });
    }
}
