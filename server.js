const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1. CONFIGURACIÓN DE LA CONEXIÓN (Ajusta según tu PC)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Tu usuario de MySQL
    password: '',      // Tu contraseña de MySQL
    database: 'la_gran_empresa'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('✅ Conectado a la base de datos la_gran_empresa');
});

// 2. RUTA PARA RECIBIR LOS DATOS DEL FORMULARIO (Basado en tu app.js)
app.post('/api/guardar-documento', (req, res) => {
    const { numero, fecha, tipo, entidad, concepto, movimientos, total } = req.body;

    // A. Insertar en la tabla 'documentos' (Encabezado)
    const sqlDoc = `INSERT INTO documentos (folio, fecha, tipo_movimiento, entidad_nombre, id_concepto, total_documento) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(sqlDoc, [numero, fecha, tipo, entidad, concepto, total], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error al guardar el encabezado");
        }

        const idDocumento = result.insertId; // Obtenemos el ID generado

        // B. Insertar cada producto en 'movimientos_detalle'
        // Preparamos los datos para una inserción múltiple
        const valoresMovimientos = movimientos.map(m => [
            idDocumento, 
            m.producto, // Aquí asumo que mandas el ID del producto
            m.cantidad, 
            m.precio, 
            m.subtotal
        ]);

        const sqlDetalle = `INSERT INTO movimientos_detalle (id_documento, id_producto, cantidad, precio_unitario, subtotal) 
                            VALUES ?`;

        db.query(sqlDetalle, [valoresMovimientos], (errDetalle) => {
            if (errDetalle) {
                console.error(errDetalle);
                return res.status(500).send("Error al guardar los productos");
            }
            res.status(200).send({ mensaje: "¡Documento y movimientos guardados con éxito!", id: idDocumento });
        });
    });
});

// 3. INICIAR EL SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// RUTA POST
// Guardar en cualquier catálogo (Productos, Proveedores, etc.)
app.post('/api/catalogos/:tabla', (req, res) => {
    const tabla = req.params.tabla; // Ejemplo: 'productos' o 'proveedores'
    const datos = req.body; 

    // Creamos la consulta dinámicamente
    const sql = `INSERT INTO ?? SET ?`;
    
    db.query(sql, [tabla, datos], (err, result) => {
        if (err) {
            console.error("Error al guardar en catálogo:", err);
            return res.status(500).send(err);
        }
        res.status(200).json({ mensaje: "Registro guardado", id: result.insertId });
    });
});

// GETS
// Obtener todos los registros de una tabla de catálogo
app.get('/api/catalogos/:tabla', (req, res) => {
    const tabla = req.params.tabla;

    const sql = `SELECT * FROM ??`;
    
    db.query(sql, [tabla], (err, results) => {
        if (err) {
            console.error("Error al leer catálogo:", err);
            return res.status(500).send(err);
        }
        res.status(200).json(results);
    });
});