<?php
header("Content-Type: application/json; charset=UTF-8");

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once "conexion.php";

$conn->query("CREATE TABLE IF NOT EXISTS notas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) DEFAULT 'Nota sin título',
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        $sql = "SELECT id, titulo, contenido AS body, DATE_FORMAT(creado_en, '%d/%m/%Y %H:%i') AS date FROM notas ORDER BY id DESC";
        $resultado = $conn->query($sql);
        $notas = [];

        while ($fila = $resultado->fetch_assoc()) {
            $notas[] = $fila;
        }

        echo json_encode($notas);
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);

        $titulo = !empty($datos['titulo']) ? trim($datos['titulo']) : 'Nota sin título';
        $contenido = trim($datos['contenido'] ?? '');

        if (!empty($contenido)) {
            try {
                $stmt = $conn->prepare("INSERT INTO notas (titulo, contenido) VALUES (?, ?)");
                $stmt->bind_param('ss', $titulo, $contenido);

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
            echo json_encode(["status" => "error", "message" => "El contenido no puede estar vacío"]);
        }
        break;

    case 'DELETE':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $sql = "DELETE FROM notas WHERE id = $id";
            if ($conn->query($sql)) {
                echo json_encode(["status" => "ok"]);
            } else {
                echo json_encode(["status" => "error", "message" => $conn->error]);
            }
        }
        break;
}

$conn->close();
?>