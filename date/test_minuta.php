<?php
require_once 'conexion.php';

$conn->query("CREATE TABLE IF NOT EXISTS minutas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo_superior VARCHAR(255) DEFAULT '',
    fecha DATE NOT NULL,
    hora VARCHAR(20) DEFAULT '',
    lugar VARCHAR(255) DEFAULT '',
    informa VARCHAR(255) DEFAULT '',
    resumen TEXT NOT NULL,
    titulo_inferior VARCHAR(255) DEFAULT '',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$stmt = $conn->prepare("INSERT INTO minutas (titulo_superior, fecha, hora, lugar, informa, resumen, titulo_inferior) VALUES (?, ?, ?, ?, ?, ?, ?)");
$valor1 = 'PRUEBA';
$valor2 = '2026-08-08';
$valor3 = '10:00';
$valor4 = 'Lugar';
$valor5 = 'Yo';
$valor6 = 'Resumen';
$valor7 = 'Lema';
$stmt->bind_param('sssssss', $valor1, $valor2, $valor3, $valor4, $valor5, $valor6, $valor7);
$stmt->execute();
echo json_encode(["status" => "ok", "id" => $stmt->insert_id]);
$stmt->close();
$conn->close();
