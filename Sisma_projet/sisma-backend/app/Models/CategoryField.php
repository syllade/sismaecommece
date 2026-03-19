<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryField extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'type',
        'options',
        'is_required',
        'is_filterable',
        'position',
        'is_active',
    ];

    protected $casts = [
        'options' => 'array',
        'is_required' => 'boolean',
        'is_filterable' => 'boolean',
        'is_active' => 'boolean',
        'position' => 'integer',
    ];

    /**
     * Relation with category
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Scope for active fields
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope ordered by position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('position', 'asc');
    }

    /**
     * Get schema for API response
     */
    public function toSchema()
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'required' => $this->is_required,
            'options' => $this->type === 'select' || $this->type === 'multi_select' 
                ? $this->options 
                : null,
            'filterable' => $this->is_filterable,
        ];
    }
}
