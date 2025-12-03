<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

require_once "config.php";

$action = $_GET['action'] ?? '';

if ($action === 'list') {
    // Get all products
    $result = $conn->query("SELECT * FROM products ORDER BY created_at DESC");
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode([
        "success" => true,
        "data" => $rows
    ]);
    exit;
}

if ($action === 'add' && $_SERVER["REQUEST_METHOD"] === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "message" => "Invalid JSON"]);
        exit;
    }

    $farmer_name   = $conn->real_escape_string($data['farmer_name'] ?? '');
    $crop_name     = $conn->real_escape_string($data['crop_name'] ?? '');
    $quantity_kg   = (float)($data['quantity_kg'] ?? 0);
    $price_per_kg  = (float)($data['price_per_kg'] ?? 0);
    $location      = $conn->real_escape_string($data['location'] ?? '');
    $contact_phone = $conn->real_escape_string($data['contact_phone'] ?? '');

    if (
        $farmer_name === '' || $crop_name === '' || $quantity_kg <= 0 ||
        $price_per_kg <= 0 || $location === '' || $contact_phone === ''
    ) {
        echo json_encode(["success" => false, "message" => "Please fill all fields correctly"]);
        exit;
    }

    $sql = "INSERT INTO products (farmer_name, crop_name, quantity_kg, price_per_kg, location, contact_phone)
            VALUES ('$farmer_name', '$crop_name', $quantity_kg, $price_per_kg, '$location', '$contact_phone')";

    if ($conn->query($sql)) {
        echo json_encode(["success" => true, "message" => "Product listed successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "DB Error: " . $conn->error]);
    }
    exit;
}

// Default: invalid action
echo json_encode(["success" => false, "message" => "Invalid action"]);
