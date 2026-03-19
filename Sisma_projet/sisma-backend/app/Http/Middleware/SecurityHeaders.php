<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Content Security Policy
        $csp = "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.pusher.com https://js.stripe.com; " .
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
            "font-src 'self' https://fonts.gstatic.com; " .
            "img-src 'self' data: https: blob:; " .
            "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://api.stripe.com; " .
            "frame-src https://js.stripe.com https://hooks.stripe.com;";

        $response->headers->set('Content-Security-Policy', $csp);
        
        // X-Content-Type-Options
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // X-Frame-Options
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        
        // X-XSS-Protection (legacy but still useful)
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Referrer-Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions-Policy
        $response->headers->set('Permissions-Policy', 
            'accelerometer=(), ' .
            'camera=(), ' .
            'geolocation=(), ' .
            'gyroscope=(), ' .
            'magnetometer=(), ' .
            'microphone=(), ' .
            'payment=(), ' .
            'usb=()'
        );
        
        // Strict Transport Security (HSTS) - only in production
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
