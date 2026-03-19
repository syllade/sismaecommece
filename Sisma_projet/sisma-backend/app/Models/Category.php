<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class Category extends Model
{

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Boot du modèle
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($category) {
            // Générer le slug seulement s'il est vraiment vide ou null
            // Vérifier si le slug existe et n'est pas vide après trim
            $hasSlug = isset($category->slug) && $category->slug !== null && trim($category->slug) !== '';
            
            if (!$hasSlug) {
                // S'assurer que le nom existe et n'est pas vide
                if (empty($category->name) || trim($category->name) === '') {
                    throw new \InvalidArgumentException('Le nom de la catégorie est requis pour générer le slug');
                }
                
                $baseSlug = Str::slug($category->name);
                
                // Si le slug généré est vide (caractères spéciaux uniquement), utiliser un slug par défaut
                if (empty($baseSlug)) {
                    $baseSlug = 'categorie-' . time();
                }
                
                $slug = $baseSlug;
                $counter = 1;
                
                // Vérifier l'unicité du slug avec une limite de sécurité
                $maxAttempts = 100;
                $attempts = 0;
                
                while ($attempts < $maxAttempts) {
                    try {
                        // Vérifier si le slug existe en utilisant DB directement
                        $exists = DB::table('categories')->where('slug', $slug)->exists();
                        
                        if (!$exists) {
                            break;
                        }
                        
                        $slug = $baseSlug . '-' . $counter;
                        $counter++;
                        $attempts++;
                    } catch (\Exception $e) {
                        // Si la requête échoue (table n'existe pas, etc.), utiliser le slug avec timestamp
                        \Log::warning('Erreur vérification slug: ' . $e->getMessage());
                        $slug = $baseSlug . '-' . time();
                        break;
                    }
                }
                
                // Si on a atteint la limite, ajouter un timestamp pour garantir l'unicité
                if ($attempts >= $maxAttempts) {
                    $slug = $baseSlug . '-' . time();
                }
                
                $category->slug = $slug;
            } else {
                // Si un slug est fourni, s'assurer qu'il est valide (nettoyé)
                $slugValue = Str::slug($category->slug);
                if (empty($slugValue)) {
                    // Si le slug fourni est invalide après nettoyage, générer un nouveau slug
                    $baseSlug = Str::slug($category->name);
                    if (empty($baseSlug)) {
                        $baseSlug = 'categorie-' . time();
                    }
                    $category->slug = $baseSlug;
                } else {
                    $category->slug = $slugValue;
                }
            }
        });

        static::updating(function ($category) {
            if ($category->isDirty('name') && empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Scope pour les catégories actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour trier par ordre
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc')->orderBy('name', 'asc');
    }

    /**
     * Relation avec les produits
     */
    public function products()
    {
        return $this->hasMany('App\Models\Product');
    }

    /**
     * Relation avec les attributs de la catégorie
     */
    public function attributes()
    {
        return $this->hasMany('App\Models\CategoryAttribute')->orderBy('sort_order', 'asc');
    }
}

