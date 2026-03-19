<?php

namespace Database\Seeders;

use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed a default admin account if missing.
     */
    public function run(): void
    {
        $admin = User::where('email', 'admin@fashop.com')->first();
        if ($admin) {
            $this->command?->info("L'utilisateur admin existe deja.");
            return;
        }

        User::create([
            'name' => 'Admin',
            'email' => 'admin@fashop.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->command?->info('Utilisateur admin cree avec succes.');
        $this->command?->info('Email: admin@fashop.com');
        $this->command?->info('Password: admin123');
    }
}
