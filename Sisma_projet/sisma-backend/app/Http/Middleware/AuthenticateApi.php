<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ApiToken;
use App\User;
use App\Support\ApiResponse;

class AuthenticateApi
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
        try {
            $token = $request->header('Authorization');
            
            if (!$token) {
                return ApiResponse::error('Token manquant', 401, 'AUTH_TOKEN_MISSING');
            }

            $token = str_replace('Bearer ', '', $token);
            
            $apiToken = ApiToken::where('token', $token)->first();
            
            if (!$apiToken || !$apiToken->isValid()) {
                if ($apiToken && !$apiToken->isValid()) {
                    try {
                        $apiToken->delete();
                    } catch (\Exception $e) {
                        // Ignore delete errors
                    }
                }
                return ApiResponse::error('Token invalide ou expire', 401, 'AUTH_TOKEN_INVALID');
            }

            $user = null;
            try {
                $user = $apiToken->user;
            } catch (\Exception $e) {
                return ApiResponse::error('Erreur lors de la recuperation de l\'utilisateur', 401, 'AUTH_USER_ERROR');
            }
            
            if (!$user || !$user->is_active) {
                return ApiResponse::error('Utilisateur inactif', 401, 'AUTH_USER_INACTIVE');
            }

            // Attacher l'utilisateur a la requete
            $request->setUserResolver(function () use ($user) {
                return $user;
            });

            return $next($request);
        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('AuthenticateApi Database Error: ' . $e->getMessage());
            return ApiResponse::error('Erreur de base de donnees', 500, 'DB_ERROR');
        } catch (\Exception $e) {
            \Log::error('AuthenticateApi Error: ' . $e->getMessage());
            return ApiResponse::error('Erreur d\'authentification', 500, 'AUTH_ERROR');
        }
    }
}
