<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMarketingCampaignsTable extends Migration
{
    public function up()
    {
        Schema::create('marketing_campaigns', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedBigInteger('product_id');
            $table->string('product_name');
            $table->unsignedBigInteger('supplier_id');
            $table->string('supplier_name');
            $table->decimal('budget', 12, 2)->default(0);
            $table->decimal('cpc', 8, 2)->default(0);
            $table->enum('status', ['pending', 'approved', 'rejected', 'paused'])->default('pending');
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->decimal('spend', 12, 2)->default(0);
            $table->decimal('attributed_revenue', 12, 2)->default(0);
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['supplier_id', 'status']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('marketing_campaigns');
    }
}
