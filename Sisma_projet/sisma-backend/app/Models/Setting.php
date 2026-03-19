<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * Boot du modèle
     */
    protected static function boot()
    {
        parent::boot();

        // Vider le cache lors de la mise à jour
        static::saved(function () {
            Cache::forget('settings');
        });

        static::deleted(function () {
            Cache::forget('settings');
        });
    }

    /**
     * Obtenir un paramètre par sa clé
     */
    public static function get($key, $default = null)
    {
        $settings = Cache::rememberForever('settings', function () {
            return static::query()->get()->pluck('value', 'key')->toArray();
        });

        return isset($settings[$key]) ? $settings[$key] : $default;
    }

    /**
     * Définir un paramètre
     */
    public static function set($key, $value)
    {
        // Protection: éviter les insertions avec clé nulle (cause principale des 500 sur /api/admin/settings)
        if (!is_string($key) || trim($key) === '') {
            throw new \InvalidArgumentException('La clé du paramètre est obligatoire');
        }

        $key = trim($key);

        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            $setting = new self();
            $setting->key = $key;
            $setting->type = (is_array($value) || is_object($value)) ? 'json' : 'string';
        }

        // Si la valeur devient un objet/tableau, on force le type json pour que l'accessor decode correctement
        if (is_array($value) || is_object($value)) {
            $setting->type = 'json';
        }
        
        $setting->value = is_array($value) || is_object($value) ? json_encode($value) : $value;
        $setting->save();

        return $setting;
    }


    /**
     * Obtenir les valeurs castées selon le type
     */
    public function getValueAttribute($value)
    {
        switch ($this->type) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'integer':
                return (int) $value;
            case 'float':
                return (float) $value;
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }
}

