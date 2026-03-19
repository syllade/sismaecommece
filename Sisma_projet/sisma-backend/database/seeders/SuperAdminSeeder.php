<?php

namespace Database\Seeders;

use App\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed a default super admin account if missing.
     */
    public function run(): void
    {
        $superAdmin = User::where('email', 'superadmin@fashop.com')->first();
        if ($superAdmin) {
            $this->command?->info("L'utilisateur super_admin existe deja.");
            return;
        }

        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@fashop.com',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);

        $this->command?->info('Utilisateur super_admin cree avec succes.');
        $this->command?->info('Email: superadmin@fashop.com');
        $this->command?->info('Password: admin123');
    }
}
