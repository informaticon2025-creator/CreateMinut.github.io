<?php
header("Content-Type: application/json; charset=UTF-8");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

require_once "conexion.php";

$response = [
    'status' => 'ok',
    'server_time' => date('c'),
    'database' => '',
    'tables' => []
];

try {
    $dbName = '';
    $res = $conn->query('SELECT DATABASE() AS db');
    if ($res) {
        $row = $res->fetch_assoc();
        $dbName = $row['db'] ?? '';
    }
    $response['database'] = $dbName;

    $tablesToCheck = ['configuracion', 'notas', 'minutas'];
    foreach ($tablesToCheck as $t) {
        $r = $conn->query("SHOW TABLES LIKE '" . $conn->real_escape_string($t) . "'");
        $response['tables'][$t] = ($r && $r->num_rows > 0) ? 'exists' : 'missing';
    }

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();

?>
