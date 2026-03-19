<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\User::where('email', 'sisma@admin.ci')->first();
if ($user) {
    $user->role = 'super_admin';
    $user->save();
    echo "Role updated to super_admin for " . $user->email;
} else {
    echo "User not found";
}
