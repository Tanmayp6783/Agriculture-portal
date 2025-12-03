// server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "agro_portal",
  waitForConnections: true,
  connectionLimit: 10,
});

// Helper to run queries
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/* ---------- Farmer register ---------- */
app.post("/api/farmers/register", async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existing = await query("SELECT id FROM farmers WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      "INSERT INTO farmers (name, email, password_hash, phone, location) VALUES (?, ?, ?, ?, ?)",
      [name, email, hash, phone || null, location || null]
    );

    res.json({ message: "Farmer registered successfully." });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* ---------- Farmer login ---------- */
app.post("/api/farmers/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const farmers = await query("SELECT id, name, email, password_hash FROM farmers WHERE email = ?", [email]);
    if (farmers.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const farmer = farmers[0];
    const ok = await bcrypt.compare(password, farmer.password_hash);
    if (!ok) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // Very simple: return farmer info (no JWT here)
    res.json({
      farmer: {
        id: farmer.id,
        name: farmer.name,
        email: farmer.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* ---------- Add crop ---------- */
app.post("/api/crops", async (req, res) => {
  try {
    const { farmerId, name, quantityKg, pricePerKg, location } = req.body;
    if (!farmerId || !name || !quantityKg || !pricePerKg) {
      return res.status(400).json({ error: "Missing required crop fields." });
    }

    await query(
      "INSERT INTO crops (farmer_id, name, quantity_kg, price_per_kg, location) VALUES (?, ?, ?, ?, ?)",
      [farmerId, name, quantityKg, pricePerKg, location || null]
    );

    res.json({ message: "Crop added successfully." });
  } catch (err) {
    console.error("Add crop error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* ---------- Get all crops ---------- */
app.get("/api/crops", async (req, res) => {
  try {
    const rows = await query(
      `SELECT c.id, c.name, c.quantity_kg AS quantityKg, c.price_per_kg AS pricePerKg,
              c.location, f.name AS farmerName
       FROM crops c
       LEFT JOIN farmers f ON c.farmer_id = f.id
       ORDER BY c.id DESC`
    );
    res.json({ crops: rows });
  } catch (err) {
    console.error("Get crops error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/* ---------- Contact endpoint ---------- */
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }
    // For now just log it; you can store in DB or send email later
    console.log("Contact message:", { name, email, message });

    res.json({ message: "Message received." });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
