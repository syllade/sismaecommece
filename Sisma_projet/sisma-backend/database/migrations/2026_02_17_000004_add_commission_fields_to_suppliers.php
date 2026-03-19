<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class AddCommissionFieldsToSuppliers extends Migration
{
    public function up()
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(0);
            }
            if (!Schema::hasColumn('suppliers', 'invoice_frequency')) {
                $table->string('invoice_frequency', 20)->default('weekly');
            }
        });
    }

    public function down()
    {
        Schema::table('suppliers', function (Blueprint $table) {
            if (Schema::hasColumn('suppliers', 'commission_rate')) {
                $table->dropColumn('commission_rate');
            }
            if (Schema::hasColumn('suppliers', 'invoice_frequency')) {
                $table->dropColumn('invoice_frequency');
            }
        });
    }
}
