// ====================================================================
// Servidor Educativo Minimalista: Node.js + Express + SQLite
// GearSoftCA - "Impulsa tu negocio con soluciones innovadoras"
// ====================================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// 1. MIDDLEWARES BÁSICOS (Sin librerías externas adicionales)
app.use(express.json());       // Para entender datos en formato JSON
app.use(express.static('.'));  // Para servir index.html, estilos.css y pro.js

// 2. CONEXIÓN A SQLITE (Crea database.sqlite si no existe)
const db = new sqlite3.Database('./database.sqlite');

// Crear la tabla de estudiantes si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS estudiantes_lab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    comentario TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 3. RUTAS DE LA API (GET y POST)

// Obtener todos los registros guardados
app.get('/api/estudiantes', (req, res) => {
  db.all('SELECT * FROM estudiantes_lab ORDER BY id DESC', [], (err, filas) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(filas);
  });
});

// Guardar un nuevo estudiante
app.post('/api/estudiantes', (req, res) => {
  const { nombre, email, comentario } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y correo son requeridos' });
  }

  const sql = 'INSERT INTO estudiantes_lab (nombre, email, comentario) VALUES (?, ?, ?)';
  db.run(sql, [nombre, email, comentario || ''], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, nombre, email, comentario });
  });
});

// 4. INICIAR SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor de clases listo en: http://localhost:${PORT}`);
});
