<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\User;
use App\Models\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogService;

class AuthController extends Controller
{
    /**
     * Connexion (Login) - Version simplifiée
     */
    public function login(Request $request)
    {
        // DEBUG: Log incoming request data
        \Log::info('DEBUG LOGIN: Raw input', [
            'all' => $request->all(),
            'email' => $request->input('email'),
            'username' => $request->input('username'),
            'password' => $request->input('password') ? 'present' : 'missing',
            'content_type' => $request->header('Content-Type'),
        ]);
        
        try {
            // Validation - accept both email and username (just check password is present)
            $this->validate($request, [
                'password' => 'required',
            ]);

            // Get email - handle both username and email fields
            $email = $request->input('email') ?? $request->input('username');
            
            if (!$email) {
                return response()->json([
                    'message' => 'Email ou username requis.',
                    'errors' => ['email' => ['Email ou username requis.']]
                ], 422);
            }

            // Trouver l'utilisateur
            $user = User::where('email', $email)->first();

            if (!$user) {
                AuditLogService::record('auth.login.failed', null, array(
                    'email' => $request->input('email'),
                    'reason' => 'user_not_found',
                ), 'auth');
                return response()->json([
                    'message' => 'Les identifiants sont incorrects.',
                    'errors' => ['email' => ['Les identifiants sont incorrects.']]
                ], 422);
            }

            // Vérifier le mot de passe
            if (!Hash::check($request->input('password'), $user->password)) {
                AuditLogService::record('auth.login.failed', $user, array(
                    'email' => $request->input('email'),
                    'reason' => 'bad_password',
                ), 'auth');
                return response()->json([
                    'message' => 'Les identifiants sont incorrects.',
                    'errors' => ['email' => ['Les identifiants sont incorrects.']]
                ], 422);
            }

            // Vérifier is_active (avec fallback)
            $isActive = true;
            try {
                if (isset($user->is_active)) {
                    $isActive = (bool)$user->is_active;
                }
            } catch (\Exception $e) {
                // Ignorer si la colonne n'existe pas
            }

            if (!$isActive) {
                AuditLogService::record('auth.login.failed', $user, array(
                    'reason' => 'inactive_user',
                ), 'auth');
                return response()->json([
                    'message' => 'Votre compte est désactivé.',
                    'errors' => ['email' => ['Votre compte est désactivé.']]
                ], 422);
            }

            // Vérifier le rôle (avec fallback)
            $userRole = 'client';
            try {
                if (isset($user->role) && $user->role) {
                    $userRole = $user->role;
                }
            } catch (\Exception $e) {
                // Ignorer si la colonne n'existe pas
            }
            if ($userRole === 'user' || !$userRole) {
                $userRole = 'client';
            }

            // Générer le token API
            $tokenValue = $this->issueApiTokenForUser($user, 30);

            // Enregistrer l'audit log
            try {
                AuditLogService::record('auth.login.success', $user, array(
                    'role' => $userRole,
                ), 'auth');
            } catch (\Exception $e) {
                // Ignorer les erreurs d'audit
            }

            // Résoudre le chemin de redirection
            $redirectPath = '/account';
            try {
                if (method_exists($user, 'redirectPathByRole')) {
                    $redirectPath = $user->redirectPathByRole();
                }
                // Handle super_admin role
                if ($userRole === 'super_admin') {
                    $redirectPath = '/super-admin/dashboard';
                }
            } catch (\Exception $e) {
                $redirectPath = $this->resolveRedirectPathByRole($userRole);
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $userRole,
                    'is_active' => $isActive,
                ],
                'token' => $tokenValue,
                'token_type' => 'Bearer',
                'expires_in' => 30 * 24 * 60 * 60, // 30 days in seconds
                'redirect_path' => $redirectPath,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            // Log de l'erreur
            try {
                \Log::error('Erreur login: ' . $e->getMessage());
                \Log::error('Fichier: ' . $e->getFile() . ':' . $e->getLine());
            } catch (\Exception $logError) {
                // Ignorer si le logging échoue
            }
            
            // Retourner l'erreur avec détails si debug activé
            $response = [
                'message' => 'Erreur serveur',
                'error' => $e->getMessage(),
            ];

            if (config('app.debug', false)) {
                $response['debug'] = [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => explode("\n", $e->getTraceAsString())
                ];
            }

            return response()->json($response, 500);
        }
    }

    /**
     * Inscription (Register)
     */
    public function register(Request $request)
    {
        $this->validate($request, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role' => 'client',
        ]);

        $tokenValue = $this->issueApiTokenForUser($user, 30);
        AuditLogService::record('auth.register', $user, array(
            'role' => 'client',
        ), 'auth');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => (isset($user->role) && $user->role !== 'user') ? $user->role : 'client',
            ],
            'token' => $tokenValue,
            'token_type' => 'Bearer',
            'redirect_path' => method_exists($user, 'redirectPathByRole')
                ? $user->redirectPathByRole()
                : $this->resolveRedirectPathByRole((isset($user->role) && $user->role !== 'user') ? $user->role : 'client'),
        ], 201);
    }

    /**
     * Déconnexion (Logout)
     */
    public function logout(Request $request)
    {
        $token = $request->header('Authorization');
        $deletedTokens = 0;
        if ($token) {
            $token = str_replace('Bearer ', '', $token);
            try {
                $deletedTokens = ApiToken::where('token', $token)->delete();
            } catch (\Exception $e) {
                // Ignorer si la table n'existe pas
            }
        }
        AuditLogService::record('auth.logout', $request->user(), array(
            'deleted_tokens' => $deletedTokens,
        ), 'auth');

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    /**
     * Obtenir l'utilisateur connecté
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => (isset($user->role) && $user->role !== 'user') ? $user->role : 'client',
            'is_active' => isset($user->is_active) ? (bool)$user->is_active : true,
            'redirect_path' => method_exists($user, 'redirectPathByRole')
                ? $user->redirectPathByRole()
                : $this->resolveRedirectPathByRole((isset($user->role) && $user->role !== 'user') ? $user->role : 'client'),
        ]);
    }

    /**
     * Rafraîchir le token
     */
    public function refresh(Request $request)
    {
        $token = $request->header('Authorization');
        if ($token) {
            $token = str_replace('Bearer ', '', $token);
            try {
                ApiToken::where('token', $token)->delete();
            } catch (\Exception $e) {
                // Ignorer
            }
        }
        
        $tokenValue = $this->issueApiTokenForUser($request->user(), 30);

        return response()->json([
            'token' => $tokenValue,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Vérifier validité d'un token d'activation.
     */
    public function activationStatus($token)
    {
        if (!$token) {
            return response()->json(['message' => 'Token manquant'], 422);
        }

        $user = User::where('activation_token', $token)->first();
        if (!$user) {
            return response()->json([
                'valid' => false,
                'message' => 'Lien invalide',
            ], 404);
        }

        if (isset($user->activation_token_expires_at) && $user->activation_token_expires_at) {
            $expires = strtotime((string)$user->activation_token_expires_at);
            if ($expires !== false && $expires < time()) {
                return response()->json([
                    'valid' => false,
                    'message' => 'Lien expiré',
                ], 410);
            }
        }

        return response()->json([
            'valid' => true,
            'email' => $user->email,
            'role' => (isset($user->role) && $user->role !== 'user') ? $user->role : 'client',
        ]);
    }

    /**
     * Activation initiale de compte: définit le mot de passe et active l'utilisateur.
     */
    public function activate(Request $request)
    {
        $this->validate($request, [
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('activation_token', $request->input('token'))->first();
        if (!$user) {
            AuditLogService::record('auth.activate.failed', null, array(
                'reason' => 'invalid_token',
            ), 'auth');
            return response()->json([
                'message' => 'Lien d activation invalide',
            ], 404);
        }

        if (isset($user->activation_token_expires_at) && $user->activation_token_expires_at) {
            $expires = strtotime((string)$user->activation_token_expires_at);
            if ($expires !== false && $expires < time()) {
                AuditLogService::record('auth.activate.failed', $user, array(
                    'reason' => 'expired_token',
                ), 'auth');
                return response()->json([
                    'message' => 'Lien d activation expire',
                ], 410);
            }
        }

        $updateData = [
            'password' => Hash::make($request->input('password')),
            'is_active' => 1,
            'activation_token' => null,
            'activation_token_expires_at' => null,
            'password_set_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (DB::getSchemaBuilder()->hasColumn('users', 'email_verified_at')) {
            $updateData['email_verified_at'] = date('Y-m-d H:i:s');
        }

        User::where('id', $user->id)->update($updateData);
        $user = User::where('id', $user->id)->first();

        $tokenValue = $this->issueApiTokenForUser($user, 30);

        $role = (isset($user->role) && $user->role !== 'user') ? $user->role : 'client';

        AuditLogService::record('auth.activate.success', $user, array(
            'role' => $role,
        ), 'auth');

        return response()->json([
            'message' => 'Compte active avec succes',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'is_active' => true,
            ],
            'token' => $tokenValue,
            'token_type' => 'Bearer',
            'redirect_path' => method_exists($user, 'redirectPathByRole')
                ? $user->redirectPathByRole()
                : $this->resolveRedirectPathByRole($role),
        ]);
    }

    private function resolveRedirectPathByRole($role)
    {
        if ($role === 'user') return '/account';
        if ($role === 'admin') return '/admin/dashboard';
        if ($role === 'super_admin') return '/super-admin/dashboard';
        if ($role === 'supplier') return '/supplier/dashboard';
        if ($role === 'delivery') return '/delivery/dashboard';
        return '/account';
    }

    private function issueApiTokenForUser($user, $expiresInDays = 30)
    {
        $fallbackToken = bin2hex(openssl_random_pseudo_bytes(30));
        if (!$user || !isset($user->id)) {
            return $fallbackToken;
        }

        try {
            if (method_exists($user, 'createApiToken')) {
                $apiToken = $user->createApiToken($expiresInDays);
                if (is_object($apiToken) && isset($apiToken->token)) {
                    return $apiToken->token;
                }
            }
        } catch (\Exception $e) {
            // Log the error for debugging
            try { \Log::warning('API token creation failed: ' . $e->getMessage()); } catch (\Exception $logErr) {}
        }

        try {
            // Try to insert directly into api_tokens table
            DB::table('api_tokens')->insert(array(
                'user_id' => (int)$user->id,
                'token' => $fallbackToken,
                'expires_at' => date('Y-m-d H:i:s', strtotime('+' . (int)$expiresInDays . ' days')),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ));
            return $fallbackToken;
        } catch (\Exception $e) {
            try { \Log::warning('Issue token fallback insert failed: ' . $e->getMessage()); } catch (\Exception $logErr) {}
        }

        return $fallbackToken;
    }

    /**
     * Rafraîchir le token API
     * POST /api/refresh-token
     */
    public function refreshToken(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if (!$token) {
                return response()->json([
                    'message' => 'Token manquant'
                ], 401);
            }

            // Vérifier le token existant
            $apiToken = DB::table('api_tokens')
                ->where('token', $token)
                ->where('expires_at', '>', date('Y-m-d H:i:s'))
                ->first();

            if (!$apiToken) {
                return response()->json([
                    'message' => 'Token invalide ou expiré'
                ], 401);
            }

            // Obtenir l'utilisateur
            $user = User::find($apiToken->user_id);
            
            if (!$user) {
                return response()->json([
                    'message' => 'Utilisateur non trouvé'
                ], 401);
            }

            // Supprimer l'ancien token
            DB::table('api_tokens')->where('id', $apiToken->id)->delete();

            // Générer un nouveau token
            $newToken = $this->issueApiTokenForUser($user, 30);

            // Obtenir le rôle
            $userRole = isset($user->role) && $user->role ? $user->role : 'client';
            if ($userRole === 'user' || !$userRole) {
                $userRole = 'client';
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $userRole,
                    'is_active' => isset($user->is_active) ? (bool)$user->is_active : true,
                ],
                'token' => $newToken,
                'token_type' => 'Bearer',
                'expires_in' => 30 * 24 * 60 * 60, // 30 days in seconds
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du rafraîchissement du token',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
