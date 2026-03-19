<?php

namespace App\Exceptions;

use Exception;
use Throwable;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use App\Support\ApiResponse;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        AuthorizationException::class,
        HttpException::class,
        ModelNotFoundException::class,
        ValidationException::class,
    ];

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param  \Exception  $e
     * @return void
     */
    public function report(Throwable $e)
    {
        parent::report($e);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $e
     * @return \Illuminate\Http\Response
     */
    public function render($request, Throwable $e)
    {
        if ($request->is('api/*')) {
            $status = 500;
            $code = 'SERVER_ERROR';
            $message = 'Erreur interne du serveur';
            $details = null;

            if ($e instanceof ValidationException) {
                $status = 422;
                $code = 'VALIDATION_ERROR';
                $message = 'Erreur de validation';
                if (method_exists($e, 'errors')) {
                    $details = $e->errors();
                }
            } elseif ($e instanceof AuthorizationException) {
                $status = 403;
                $code = 'FORBIDDEN';
                $message = 'Acces refuse';
            } elseif ($e instanceof ModelNotFoundException) {
                $status = 404;
                $code = 'RESOURCE_NOT_FOUND';
                $message = 'Ressource introuvable';
            } elseif ($e instanceof HttpException && method_exists($e, 'getStatusCode')) {
                $status = (int) $e->getStatusCode();
                $code = 'HTTP_' . $status;
                $message = $status >= 500 ? 'Erreur interne du serveur' : $e->getMessage();
            }

            if (config('app.debug')) {
                $details = array(
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                );
            }

            $response = ApiResponse::error($message, $status, $code, $details);
            return $this->appendCorsHeaders($request, $response);
        }

        $response = parent::render($request, $e);
        return $response;
    }

    private function appendCorsHeaders($request, $response)
    {
        $origin = $request->header('Origin');
        $allowOrigin = $origin ? $origin : '*';
        $allowCredentials = $origin ? 'true' : 'false';

        $response->header('Access-Control-Allow-Origin', $allowOrigin);
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->header('Access-Control-Allow-Credentials', $allowCredentials);
        $response->header('Access-Control-Max-Age', '86400');
        $response->header('Vary', 'Origin');

        return $response;
    }
}
