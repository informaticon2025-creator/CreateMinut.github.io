<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$host = "localhost";
$user = "root";
$pass = "";
$db   = "creatorminut_db";

$adminConn = new mysqli($host, $user, $pass);
if ($adminConn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión: " . $adminConn->connect_error]));
}

$adminConn->query("CREATE DATABASE IF NOT EXISTS `$db`");
$adminConn->close();

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

$conn->set_charset("utf8mb4");

$conn->query("CREATE TABLE IF NOT EXISTS configuracion (
    id INT NOT NULL DEFAULT 1,
    nombre_usuario VARCHAR(100) DEFAULT NULL,
    tema VARCHAR(50) DEFAULT 'theme-tecno',
    tamano_fuente VARCHAR(50) DEFAULT 'font-sm',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE IF NOT EXISTS notas (
    id INT NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(150) DEFAULT 'Nota sin título',
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$conn->query("CREATE TABLE IF NOT EXISTS minutas (
    id INT NOT NULL AUTO_INCREMENT,
    titulo_superior VARCHAR(150) DEFAULT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    lugar VARCHAR(150) DEFAULT NULL,
    informa VARCHAR(100) DEFAULT NULL,
    resumen TEXT NOT NULL,
    titulo_inferior VARCHAR(150) DEFAULT NULL,
    extras LONGTEXT DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
// Avoid ALTER TABLE IF NOT EXISTS which may not be supported in all MySQL versions
// Schema adjustments should be done via migrations or manual SQL if needed.
?>