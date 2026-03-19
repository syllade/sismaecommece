<?php

namespace App\Http\Middleware;

use Closure;

class Cors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Liste des origines autorisées (dev par défaut)
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:3000',
            'http://localhost:8000',
            'http://127.0.0.1:8000',   
            'http://localhost:8001',
            'http://127.0.0.1:8001',
            'http://localhost:8002',
            'http://127.0.0.1:8002',
        ];

        // En production, privilégier une whitelist stricte via env.
        if (env('APP_ENV') === 'production') {
            $envOrigins = env('CORS_ALLOWED_ORIGINS', '');
            if ($envOrigins) {
                $allowedOrigins = array_filter(array_map('trim', explode(',', $envOrigins)));
            }
        }

        $origin = $request->header('Origin');
        
        // Déterminer l'origine à autoriser
        // IMPORTANT : si la requête envoie des credentials, l'origine ne peut pas être "*"
        if ($origin) {
            $isAllowedOrigin = in_array($origin, $allowedOrigins);
            if ($isAllowedOrigin || env('APP_ENV') !== 'production') {
                // En dev, on tolère plus largement. En prod, origine strictement whitelistée.
                $allowOrigin = $origin;
                $allowCredentials = 'true';
            } else {
                $allowOrigin = 'null';
                $allowCredentials = 'false';
            }
        } else {
            $allowOrigin = '*';
            $allowCredentials = 'false';
        }

        // Si c'est une requête OPTIONS (preflight), retourner directement
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
                ->header('Access-Control-Allow-Credentials', $allowCredentials)
                ->header('Access-Control-Max-Age', '86400')
                ->header('Vary', 'Origin');
        }

        // Continuer avec la requête
        try {
            $response = $next($request);
        } catch (\Exception $e) {
            // Log détaillé pour diagnostiquer les 500 intermittentes (ex: /api/admin/orders)
            try {
                \Log::error('Exception non gérée (middleware CORS)', [
                    'method' => $request->getMethod(),
                    'path' => method_exists($request, 'path') ? $request->path() : null,
                    'full_url' => method_exists($request, 'fullUrl') ? $request->fullUrl() : null,
                    'origin' => $origin,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile() . ':' . $e->getLine(),
                ]);
            } catch (\Exception $_) {
                // Ne pas casser la réponse si le logger échoue
            }
            // Si une erreur se produit, créer une réponse d'erreur avec CORS
            $response = response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
                'debug' => config('app.debug') ? [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ] : null
            ], 500);
        }

        // S'assurer que la réponse est un objet Response
        if (!($response instanceof \Illuminate\Http\Response || $response instanceof \Illuminate\Http\JsonResponse)) {
            $response = response()->json(['message' => 'Erreur de réponse'], 500);
        }

        // Ajouter les en-têtes CORS à la réponse (même en cas d'erreur)
        try {
            $response->header('Access-Control-Allow-Origin', $allowOrigin);
            $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
            $response->header('Access-Control-Allow-Credentials', $allowCredentials);
            $response->header('Access-Control-Max-Age', '86400');
            $response->header('Vary', 'Origin');
        } catch (\Exception $e) {
            // Si l'ajout des en-têtes échoue, créer une nouvelle réponse
            $response = response()->json([
                'message' => 'Erreur serveur',
                'error' => 'Erreur lors de l\'ajout des en-têtes CORS'
            ], 500)
            ->header('Access-Control-Allow-Origin', $allowOrigin)
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
            ->header('Access-Control-Allow-Credentials', $allowCredentials)
            ->header('Access-Control-Max-Age', '86400')
            ->header('Vary', 'Origin');
        }

        return $response;
    }
}

