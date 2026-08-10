<?php
header("Content-Type: application/json; charset=UTF-8");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "conexion.php";

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);

        $titulo_superior = trim($datos['ciudad'] ?? '');
        $fecha = trim($datos['fecha'] ?? '');
        $hora = trim($datos['hora'] ?? '');
        $lugar = trim($datos['lugar'] ?? '');
        $informa = trim($datos['informa'] ?? '');
        $resumen = trim($datos['resumen'] ?? '');
        $titulo_inferior = trim($datos['lema'] ?? '');
        $institucion = trim($datos['institucion'] ?? '');

        // Ensure hora is in HH:MM:SS format; if empty, use current server time
        if (empty($hora)) {
            $hora = date('H:i:s');
        } elseif (strlen($hora) === 5) {
            $hora .= ':00';
        }

        $extras_array = isset($datos['extras']) ? $datos['extras'] : [];
        $extras = json_encode($extras_array, JSON_UNESCAPED_UNICODE);

        if (!empty($resumen) && !empty($fecha)) {
            try {
                $stmt = $conn->prepare("INSERT INTO minutas (titulo_superior, fecha, hora, lugar, informa, resumen, titulo_inferior, institucion, extras) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param('sssssssss', $titulo_superior, $fecha, $hora, $lugar, $informa, $resumen, $titulo_inferior, $institucion, $extras);

                if ($stmt->execute()) {
                    echo json_encode(["status" => "ok", "id" => $stmt->insert_id]);
                } else {
                    http_response_code(500);
                    echo json_encode(["status" => "error", "message" => $stmt->error]);
                }
                $stmt->close();
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "DB exception: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Faltan datos requeridos"]);
        }
        break;

    case 'GET':
        $sql = "SELECT id, titulo_superior, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha, hora, lugar, informa, resumen, titulo_inferior, institucion, extras, creado_en FROM minutas ORDER BY id DESC";
        $resultado = $conn->query($sql);
        $minutas = [];

        while ($fila = $resultado->fetch_assoc()) {
            $fila['extras'] = json_decode($fila['extras'], true);
            $minutas[] = $fila;
        }

        echo json_encode($minutas);
        break;
}

$conn->close();
?>