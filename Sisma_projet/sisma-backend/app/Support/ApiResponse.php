<?php

namespace App\Support;

class ApiResponse
{
    public static function success($data = null, $message = 'OK', $status = 200, $meta = array())
    {
        $payload = array(
            'success' => true,
            'message' => $message,
        );

        if ($data !== null) {
            $payload['data'] = $data;
        }
        if (!empty($meta)) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    public static function paginated($data, $meta = array(), $message = 'OK')
    {
        return self::success($data, $message, 200, $meta);
    }

    public static function error($message = 'Erreur', $status = 400, $code = 'API_ERROR', $details = null)
    {
        $payload = array(
            'success' => false,
            'message' => $message,
            'error' => array(
                'code' => $code,
                'status' => $status,
            ),
        );

        if ($details !== null) {
            $payload['error']['details'] = $details;
        }

        return response()->json($payload, $status);
    }
}
