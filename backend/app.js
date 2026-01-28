const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = "mysecretkey"; // Later we can move this to Kubernetes Secret

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "mysql-service",
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
});

// Create users table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255)
  )
`, (err) => {
  if (err) console.error("Error creating users table:", err);
  else console.log("Users table ready");
});

// Create todos table if it doesn't exist
db.query(`
  CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255),
    completed BOOLEAN DEFAULT false
  )
`, (err) => {
  if (err) console.error("Error creating todos table:", err);
  else console.log("Todos table ready");
});

// ---------------- AUTH MIDDLEWARE ----------------
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---------------- ROUTES ----------------

// Health check
app.get("/", (req, res) => {
  res.send("To-Do Backend with Auth is running");
});

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hash],
    err => {
      if (err) return res.status(400).json({ error: "User already exists" });
      res.json({ message: "User registered successfully" });
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "1h"
      });

      res.json({ token, username: user.username });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Login failed" });
    }
  });
});


// Get todos for logged-in user
app.get("/todos", auth, (req, res) => {
  db.query("SELECT * FROM todos WHERE user_id = ?", [req.userId], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Add todo
app.post("/todos", auth, (req, res) => {
  const task = req.body.task;

  db.query(
    "INSERT INTO todos (task, user_id) VALUES (?, ?)",
    [task, req.userId],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).json({ id: result.insertId, task });
    }
  );
});

// Delete todo (only own)
app.delete("/todos/:id", auth, (req, res) => {
  db.query(
    "DELETE FROM todos WHERE id = ? AND user_id = ?",
    [req.params.id, req.userId],
    err => {
      if (err) return res.status(500).send(err);
      res.sendStatus(204);
    }
  );
});

// Start server
app.listen(3000, () => {
  console.log("Backend running on port 3000");
});

