const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const cors = require('cors');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 🔌 Conexión a TiDB (MySQL)
const db = mysql.createPool({
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: process.env.TIDB_PORT,
  ssl: process.env.TIDB_SSL === 'true' ? { rejectUnauthorized: true } : false
});

// =========================
// 📄 DOCUMENTOS
// =========================

// Obtener documentos
app.get('/api/documents', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM documents');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear documento
app.post('/api/documents', async (req, res) => {
  try {
    const { numero, fecha, tipo, entidad, total } = req.body;

    const [result] = await db.query(
      'INSERT INTO documents (numero, fecha, tipo, entidad, total) VALUES (?, ?, ?, ?, ?)',
      [numero, fecha, tipo, entidad, total]
    );

    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 📦 CATÁLOGOS
// =========================

// Obtener catálogos
app.get('/api/catalogs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM catalogs');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear catálogo
app.post('/api/catalogs', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const [result] = await db.query(
      'INSERT INTO catalogs (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );

    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
