<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use App\User;

class CreateSuperAdmin extends Command
{
    protected $signature = 'fashop:create-super-admin {email? : Email of the super admin} {password? : Password for the super admin}';
    protected $description = 'Create or update a super admin user';

    public function handle()
    {
        $email = $this->argument('email') ?? $this->ask('Email:', 'admin@fashop.com');
        $password = $this->argument('password') ?? $this->secret('Password:');
        
        if (!$password) {
            $this->error('Password is required!');
            return 1;
        }

        try {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->update([
                    'name' => 'Super Admin',
                    'password' => Hash::make($password),
                    'role' => 'super_admin',
                    'is_active' => true,
                ]);
                $this->info("Super admin updated: {$email}");
            } else {
                User::create([
                    'name' => 'Super Admin',
                    'email' => $email,
                    'password' => Hash::make($password),
                    'role' => 'super_admin',
                    'is_active' => true,
                ]);
                $this->info("Super admin created: {$email}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            return 1;
        }
    }
}
