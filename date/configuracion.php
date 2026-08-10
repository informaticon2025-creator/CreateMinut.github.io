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
    case 'GET':
        try {
            $resultado = $conn->query("SELECT id, nombre_usuario, tema, tamano_fuente FROM configuracion WHERE id = 1 LIMIT 1");
            $config = $resultado ? $resultado->fetch_assoc() : null;
            echo json_encode($config ?: ["id" => 1, "nombre_usuario" => null, "tema" => "theme-retro", "tamano_fuente" => "font-sm"]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "DB error: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true) ?: [];
        $nombreUsuario = trim($datos['nombre_usuario'] ?? '');
        $tema = trim($datos['tema'] ?? 'theme-retro');
        $tamanoFuente = trim($datos['tamano_fuente'] ?? 'font-sm');

        try {
            if ($stmt = $conn->prepare("INSERT INTO configuracion (id, nombre_usuario, tema, tamano_fuente) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre_usuario = VALUES(nombre_usuario), tema = VALUES(tema), tamano_fuente = VALUES(tamano_fuente)")) {
                $stmt->bind_param('sss', $nombreUsuario, $tema, $tamanoFuente);
                if ($stmt->execute()) {
                    echo json_encode(["status" => "ok", "id" => 1]);
                } else {
                    http_response_code(500);
                    echo json_encode(["status" => "error", "message" => $stmt->error]);
                }
                $stmt->close();
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $conn->error]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "DB exception: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Método no permitido"]);
        break;
}

$conn->close();
?>
