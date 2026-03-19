<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{

    protected $fillable = [
        'category_id',
        'supplier_id',
        'name',
        'slug',
        'description',
        'price',
        'discount',
        'image',
        'stock',
        'is_active',
        'is_featured',
        'views',
    ];

    protected $casts = [
        'price' => 'float',
        'discount' => 'integer',
        'stock' => 'integer',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'views' => 'integer',
    ];

    /**
     * Boot du modèle
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($product) {
            if (empty($product->slug)) {
                $baseSlug = Str::slug($product->name);
                $slug = $baseSlug;
                $counter = 1;
                
                // Vérifier l'unicité du slug
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                
                $product->slug = $slug;
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name') && empty($product->slug)) {
                $product->slug = Str::slug($product->name);
            }
        });
    }

    /**
     * Scope pour les produits actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour la recherche
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    /**
     * Scope pour les produits en promotion
     */
    public function scopeOnSale($query)
    {
        return $query->where('discount', '>', 0);
    }

    /**
     * Scope pour les produits mis en avant
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Incrémenter les vues
     */
    public function incrementViews()
    {
        $this->increment('views');
    }

    /**
     * Accessor pour le prix final (avec réduction)
     */
    public function getFinalPriceAttribute()
    {
        if ($this->discount > 0) {
            return $this->price * (1 - $this->discount / 100);
        }
        return $this->price;
    }

    /**
     * Relation avec la catégorie
     */
    public function category()
    {
        return $this->belongsTo('App\Models\Category', 'category_id');
    }

    /**
     * Relation avec le fournisseur
     */
    public function supplier()
    {
        return $this->belongsTo('App\Models\Supplier', 'supplier_id');
    }

    /**
     * Relation avec les items de commande
     */
    public function orderItems()
    {
        return $this->hasMany('App\Models\OrderItem');
    }

    /**
     * Relation avec les attributs personnalisés du produit
     */
    public function attributes()
    {
        return $this->hasMany('App\Models\ProductAttribute');
    }

    /**
     * Obtenir les attributs formatés du produit
     */
    public function getFormattedAttributes(): array
    {
        $attributes = [];
        
        foreach ($this->attributes as $attr) {
            $categoryAttr = $attr->categoryAttribute;
            if ($categoryAttr) {
                $attributes[$categoryAttr->slug] = $attr->value;
            }
        }
        
        return $attributes;
    }
}

