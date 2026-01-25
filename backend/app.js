const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "todo",
  password: process.env.DB_PASSWORD || "todo123",
  database: process.env.DB_NAME || "tododb"
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL");

  // Create table if not exists
  db.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task VARCHAR(255)
    )
  `);
});

// Health check
app.get("/", (req, res) => {
  res.send("To-Do Backend with SQL is running");
});

// Get all todos
app.get("/todos", (req, res) => {
  db.query("SELECT * FROM todos", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add todo
app.post("/todos", (req, res) => {
  const task = req.body.task;
  db.query(
    "INSERT INTO todos (task) VALUES (?)",
    [task],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ id: result.insertId, task });
    }
  );
});

// Delete todo
app.delete("/todos/:id", (req, res) => {
  db.query(
    "DELETE FROM todos WHERE id = ?",
    [req.params.id],
    err => {
      if (err) return res.status(500).send(err);
      res.sendStatus(204);
    }
  );
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});
