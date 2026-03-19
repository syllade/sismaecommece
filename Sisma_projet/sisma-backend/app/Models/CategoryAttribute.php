<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategoryAttribute extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'type',
        'required',
        'placeholder',
        'help_text',
        'options',
        'validation',
        'default_value',
        'sort_order',
    ];

    protected $casts = [
        'required' => 'boolean',
        'options' => 'array',
        'validation' => 'array',
        'sort_order' => 'integer',
    ];

    /**
     * Get the category that owns this attribute.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get all product attributes for this category attribute.
     */
    public function productAttributes(): HasMany
    {
        return $this->hasMany(ProductAttribute::class);
    }

    /**
     * Get validation rules as array.
     */
    public function getValidationRules(): array
    {
        $rules = [];
        
        if ($this->required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        $validation = $this->validation ?? [];
        
        if (isset($validation['min'])) {
            $rules[] = 'min:' . $validation['min'];
        }
        
        if (isset($validation['max'])) {
            $rules[] = 'max:' . $validation['max'];
        }

        if ($this->type === 'email') {
            $rules[] = 'email';
        }

        if ($this->type === 'url') {
            $rules[] = 'url';
        }

        return $rules;
    }
}
