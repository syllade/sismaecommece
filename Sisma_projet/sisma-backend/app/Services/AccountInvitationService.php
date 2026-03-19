<?php

namespace App\Services;

use App\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AccountInvitationService
{
    public function createOrUpdateInvitedUser($data)
    {
        $email = isset($data['email']) ? trim((string)$data['email']) : '';
        $name = isset($data['name']) ? (string)$data['name'] : '';
        $role = isset($data['role']) ? (string)$data['role'] : 'client';
        $supplierId = isset($data['supplier_id']) ? (int)$data['supplier_id'] : null;
        $deliveryPersonId = isset($data['delivery_person_id']) ? (int)$data['delivery_person_id'] : null;
        $sendInvite = isset($data['send_invite']) ? (bool)$data['send_invite'] : true;

        if ($email === '') {
            return array('user' => null, 'invite_sent' => false, 'activation_token' => null);
        }

        $user = User::where('email', $email)->first();
        $activationToken = Str::random(64);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+72 hours'));

        $payload = array(
            'name' => $name !== '' ? $name : 'Utilisateur',
            'email' => $email,
            'role' => $role,
            'is_active' => 0,
            'activation_token' => $activationToken,
            'activation_token_expires_at' => $expiresAt,
            'updated_at' => date('Y-m-d H:i:s'),
        );

        if (DB::getSchemaBuilder()->hasColumn('users', 'supplier_id')) {
            $payload['supplier_id'] = $supplierId;
        }
        if (DB::getSchemaBuilder()->hasColumn('users', 'delivery_person_id')) {
            $payload['delivery_person_id'] = $deliveryPersonId;
        }

        if (!$user) {
            $payload['password'] = Hash::make(Str::random(24));
            $payload['created_at'] = date('Y-m-d H:i:s');
            $userId = DB::table('users')->insertGetId($payload);
            $user = User::where('id', $userId)->first();
        } else {
            DB::table('users')->where('id', $user->id)->update($payload);
            $user = User::where('id', $user->id)->first();
        }

        $inviteSent = false;
        if ($sendInvite) {
            $inviteSent = $this->sendActivationEmail($user, $activationToken);
        }

        return array(
            'user' => $user,
            'invite_sent' => $inviteSent,
            'activation_token' => $activationToken,
        );
    }

    private function sendActivationEmail($user, $token)
    {
        try {
            $frontendBase = rtrim((string) env('APP_FRONTEND_URL', 'http://localhost:5173'), '/');
            $activationUrl = $frontendBase . '/activate-account?token=' . urlencode($token);

            $message = "Bonjour {$user->name},\n\n";
            $message .= "Votre compte ASHOP SISMA a ete cree.\n";
            $message .= "Role: {$user->role}\n\n";
            $message .= "Activez votre compte en definissant votre mot de passe:\n";
            $message .= $activationUrl . "\n\n";
            $message .= "Ce lien expire dans 72h.\n\n";
            $message .= "Equipe ASHOP SISMA";

            $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS') ?: 'no-reply@ashopsisma.local';
            $fromName = config('mail.from.name') ?: env('MAIL_FROM_NAME') ?: 'ASHOP SISMA';

            Mail::raw($message, function ($mail) use ($user, $fromAddress, $fromName) {
                $mail->from($fromAddress, $fromName)
                    ->to($user->email)
                    ->subject('Activation de votre compte ASHOP SISMA');
            });

            return true;
        } catch (\Exception $e) {
            \Log::error('Erreur envoi invitation compte: ' . $e->getMessage());
            return false;
        }
    }
}
