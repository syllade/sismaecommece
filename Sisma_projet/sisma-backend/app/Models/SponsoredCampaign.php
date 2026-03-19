<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SponsoredCampaign extends Model
{
    protected $fillable = [
        'supplier_id',
        'product_id',
        'name',
        'budget',
        'daily_budget',
        'cost_per_click',
        'spent',
        'impressions',
        'clicks',
        'conversions',
        'status',
        'start_date',
        'end_date',
        'priority',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'daily_budget' => 'decimal:2',
        'cost_per_click' => 'decimal:2',
        'spent' => 'decimal:2',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    protected $appends = [
        'ctr',
        'conversion_rate',
        'budget_remaining',
        'budget_used_percent',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Vérifier si la campagne est active
    public function isActive()
    {
        return $this->status === 'active' 
            && $this->spent < $this->budget
            && (!$this->end_date || $this->end_date->isFuture());
    }

    // Enregistrer un clic
    public function recordClick()
    {
        $this->increment('clicks');
        $this->increment('spent', $this->cost_per_click);
        
        // Vérifier si le budget est épuisé
        if ($this->spent >= $this->budget) {
            $this->update(['status' => 'completed']);
        }
        
        $this->save();
    }

    // Enregistrer une impression
    public function recordImpression()
    {
        $this->increment('impressions');
        $this->save();
    }

    // Enregistrer une conversion
    public function recordConversion()
    {
        $this->increment('conversions');
        $this->save();
    }

    // Calculer le CTR (Click Through Rate)
    public function getCtrAttribute()
    {
        if ($this->impressions === 0) return 0;
        return round(($this->clicks / $this->impressions) * 100, 2);
    }

    // Calculer le taux de conversion
    public function getConversionRateAttribute()
    {
        if ($this->clicks === 0) return 0;
        return round(($this->conversions / $this->clicks) * 100, 2);
    }

    public function getBudgetRemainingAttribute()
    {
        $budget = (float) $this->budget;
        $spent = (float) $this->spent;
        return max(0, round($budget - $spent, 2));
    }

    public function getBudgetUsedPercentAttribute()
    {
        $budget = (float) $this->budget;
        $spent = (float) $this->spent;
        if ($budget <= 0) return 0;
        return round(($spent / $budget) * 100, 2);
    }

    // Scope pour les campagnes actives
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->whereColumn('spent', '<', 'budget')
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>', now());
            });
    }

    // Scope pour trier par priorité
    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}
