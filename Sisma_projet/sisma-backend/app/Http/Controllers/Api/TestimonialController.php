<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    /** Liste (PUBLIC) */
    public function index()
    {
        $testimonials = Testimonial::active()->ordered()->get();
        return response()->json($testimonials);
    }

    /** ADMIN: Liste complète */
    public function adminIndex()
    {
        $testimonials = Testimonial::ordered()->get();
        return response()->json($testimonials);
    }

    /** ADMIN: Créer */
    public function store(Request $request)
    {
        try {
            // Laravel 5.2 : utiliser $this->validate() au lieu de $request->validate()
            $this->validate($request, [
                'customer_name' => 'required|string|max:255',
                'customer_location' => 'required|string|max:255',
                'rating' => 'required|integer|min:1|max:5',
                'content' => 'required|string',
                'avatar_initials' => 'sometimes|string|max:2',
                'is_active' => 'sometimes|boolean',
            ]);

            // Préparer les données
            $data = array(
                'customer_name' => $request->input('customer_name'),
                'customer_location' => $request->input('customer_location'),
                'rating' => (int)$request->input('rating'),
                'content' => $request->input('content'),
                'avatar_initials' => $request->input('avatar_initials', ''),
                'is_active' => filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
            );

            $testimonial = Testimonial::create($data);

            return response()->json([
                'message' => 'Témoignage créé avec succès',
                'testimonial' => $testimonial,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'getMessageBag') ? $e->getMessageBag()->toArray() : array('message' => array($e->getMessage()));
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur création témoignage: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Mettre à jour */
    public function update(Request $request, Testimonial $testimonial)
    {
        try {
            $this->validate($request, [
                'customer_name' => 'sometimes|string|max:255',
                'customer_location' => 'sometimes|string|max:255',
                'rating' => 'sometimes|integer|min:1|max:5',
                'content' => 'sometimes|string',
                'avatar_initials' => 'sometimes|string|max:2',
                'is_active' => 'sometimes|boolean',
            ]);

            $data = array();
            if ($request->has('customer_name')) $data['customer_name'] = $request->input('customer_name');
            if ($request->has('customer_location')) $data['customer_location'] = $request->input('customer_location');
            if ($request->has('rating')) $data['rating'] = (int)$request->input('rating');
            if ($request->has('content')) $data['content'] = $request->input('content');
            if ($request->has('avatar_initials')) $data['avatar_initials'] = $request->input('avatar_initials');
            if ($request->has('is_active')) $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

            $testimonial->update($data);

            return response()->json([
                'message' => 'Témoignage mis à jour avec succès',
                'testimonial' => $testimonial,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = method_exists($e, 'getMessageBag') ? $e->getMessageBag()->toArray() : array('message' => array($e->getMessage()));
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Erreur mise à jour témoignage: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur serveur',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne du serveur',
            ], 500);
        }
    }

    /** ADMIN: Supprimer */
    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return response()->json([
            'message' => 'Témoignage supprimé avec succès',
        ]);
    }
}

