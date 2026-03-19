<?php
/**
 * Debug script to test login and see what's happening
 * Run: php debug-login.php
 */

$email = 'sisma@admin.ci';
$password = 'admin123';

// Test 1: Direct PHP call (simulating what the backend does internally)
echo "=== Test 1: Internal tinker call ===\n";
$request1 = new \Illuminate\Http\Request();
$request1->merge(['email' => $email, 'password' => $password]);
$controller = new \App\Http\Controllers\Api\AuthController();
$response1 = $controller->login($request1);
$data1 = json_decode($response1->getContent(), true);
echo "Status: " . $response1->getStatusCode() . "\n";
echo "Success: " . (isset($data1['token']) ? 'YES' : 'NO') . "\n";
if (isset($data1['message'])) {
    echo "Message: " . $data1['message'] . "\n";
}
if (isset($data1['errors'])) {
    echo "Errors: " . json_encode($data1['errors']) . "\n";
}

// Test 2: HTTP call via file_get_contents
echo "\n=== Test 2: HTTP call (file_get_contents) ===\n";
$url = 'http://localhost:8000/api/auth/login';
$data = [
    'email' => $email,
    'password' => $password
];
$context = stream_context_create([
    'http' => [
        'header'  => "Content-type: application/json\r\nAccept: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
        'ignore_errors' => true
    ]
]);
$result = @file_get_contents($url, false, $context);
echo "Raw response: " . $result . "\n";
$data2 = json_decode($result, true);
echo "Success: " . (isset($data2['token']) ? 'YES' : 'NO') . "\n";

// Test 3: HTTP call via Guzzle (if available)
echo "\n=== Test 3: Check if Guzzle is available ===\n";
if (class_exists('GuzzleHttp\Client')) {
    echo "Guzzle is available!\n";
    try {
        $client = new \GuzzleHttp\Client();
        $response3 = $client->post('http://localhost:8000/api/auth/login', [
            'json' => ['email' => $email, 'password' => $password]
        ]);
        $data3 = json_decode($response3->getBody()->getContents(), true);
        echo "Status: " . $response3->getStatusCode() . "\n";
        echo "Success: " . (isset($data3['token']) ? 'YES' : 'NO') . "\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
} else {
    echo "Guzzle is NOT available\n";
}

// Test 4: Check session and CORS
echo "\n=== Test 4: Session config ===\n";
echo "Session driver: " . config('session.driver') . "\n";
echo "Cookie name: " . config('session.cookie') . "\n";
