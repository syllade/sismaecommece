<?php
$url = 'http://127.0.0.1:8000/api/auth/login';
$data = array(
    'username' => 'sisma@admin.ci',
    'password' => 'admin123'
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ),
);

$context  = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "Error occurred\n";
} else {
    echo $result;
}
