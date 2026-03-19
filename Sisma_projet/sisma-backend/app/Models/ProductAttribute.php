<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAttribute extends Model
{
    protected $fillable = [
        'product_id',
        'category_attribute_id',
        'value',
    ];

    /**
     * Get the product that owns this attribute.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the category attribute definition.
     */
    public function categoryAttribute(): BelongsTo
    {
        return $this->belongsTo(CategoryAttribute::class);
    }

    /**
     * Get value as array (for multiselect).
     */
    public function getValueAsArray(): array
    {
        if (empty($this->value)) {
            return [];
        }
        
        $attribute = $this->categoryAttribute;
        if ($attribute && $attribute->type === 'multiselect') {
            return explode(',', $this->value);
        }
        
        return [$this->value];
    }
}
