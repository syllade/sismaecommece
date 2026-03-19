<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class SponsoredCache
{
    public const PRODUCT_LIMITS = [6, 8, 10, 12, 20];
    public const SUPPLIER_LIMITS = [4, 6, 8, 10];
    public const MIXED_LIMITS = [12, 20, 24, 30];

    public static function forgetAll(): void
    {
        foreach (self::PRODUCT_LIMITS as $limit) {
            Cache::forget("sponsored_products_{$limit}");
        }

        foreach (self::SUPPLIER_LIMITS as $limit) {
            Cache::forget("sponsored_suppliers_{$limit}");
        }

        foreach (self::MIXED_LIMITS as $limit) {
            Cache::forget("mixed_products_{$limit}");
        }
    }
}
