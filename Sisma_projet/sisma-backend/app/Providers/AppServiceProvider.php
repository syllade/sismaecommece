<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        // Force HTTPS en production si activé par variable d'environnement.
        // Ne s'applique pas en CLI pour éviter de casser artisan.
        $forceHttps = env('FORCE_HTTPS', false);
        if ($forceHttps && !$this->app->runningInConsole()) {
            URL::forceScheme('https');
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }
}
