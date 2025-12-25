<?php
// Allow cross-origin requests if frontend is opened separately
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// Connect to MySQL (adjust username/password as needed)
$pdo = new PDO("mysql:host=127.0.0.1;dbname=checklist;charset=utf8", "root", "madhav22");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// GET tasks
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    $stmt = $pdo->query("SELECT * FROM tasks ORDER BY id DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// POST new task
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $task = $_POST['task'] ?? null;
    if ($task) {
        $stmt = $pdo->prepare("INSERT INTO tasks (task, done) VALUES (?, 0)");
        $stmt->execute([$task]);
        echo "Task added";
    }
    exit;
}

// PUT update task
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data && isset($data['id'], $data['done'])) {
        $stmt = $pdo->prepare("UPDATE tasks SET done=? WHERE id=?");
        $stmt->execute([$data['done'], $data['id']]);
        echo "Task updated";
    }
    exit;
}

// DELETE task
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data && isset($data['id'])) {
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id=?");
        $stmt->execute([$data['id']]);
        echo "Task deleted";
    }
    exit;
}
?>
