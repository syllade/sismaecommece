<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CreateNotificationTemplatesTable extends Migration
{
    public function up()
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->increments('id');
            $table->string('type', 50)->unique();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->text('variables')->nullable();
            $table->string('channel', 20)->default('email'); // email, sms, push
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default templates
        DB::table('notification_templates')->insert([
            [
                'type' => 'order_created',
                'subject' => 'Nouvelle commande #{{order_id}}',
                'body' => 'Une nouvelle commande a été passée par {{customer_name}}. Montant: {{total}}FCFA',
                'variables' => json_encode(['order_id', 'customer_name', 'total']),
                'channel' => 'email',
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'type' => 'order_status_changed',
                'subject' => 'Commande #{{order_id}} - Statut mis à jour',
                'body' => 'Votre commande #{{order_id}} est maintenant: {{status}}',
                'variables' => json_encode(['order_id', 'status']),
                'channel' => 'email',
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'type' => 'supplier_invitation',
                'subject' => 'Invitation à rejoindre Fashop',
                'body' => 'Vous avez été invité à rejoindre Fashop en tant que fournisseur. Cliquez sur le lien pour créer votre compte: {{invitation_link}}',
                'variables' => json_encode(['invitation_link']),
                'channel' => 'email',
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'type' => 'driver_invitation',
                'subject' => 'Invitation à rejoindre Fashop',
                'body' => 'Vous avez été invité à rejoindre Fashop en tant que livreur. Cliquez sur le lien pour créer votre compte: {{invitation_link}}',
                'variables' => json_encode(['invitation_link']),
                'channel' => 'email',
                'is_active' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }

    public function down()
    {
        Schema::dropIfExists('notification_templates');
    }
}
