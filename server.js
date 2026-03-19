require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONEXIÓN A TIDB CLOUD (o local según variables)
const dbConfig = {
    host: process.env.TIDB_HOST || 'localhost',
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'la_gran_empresa',
    port: parseInt(process.env.TIDB_PORT || '3306'),
    ssl: process.env.TIDB_SSL === 'true' ? {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    } : null
};

// Para TiDB Cloud, necesitamos SSL pero sin verificar el certificado en algunos casos
if (process.env.TIDB_SSL === 'true' && process.env.NODE_ENV === 'production') {
    dbConfig.ssl = {
        rejectUnauthorized: false // TiDB Cloud a veces necesita esto
    };
}

const db = mysql.createConnection(dbConfig);

db.connect(err => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        console.error('Configuración usada:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port,
            ssl: !!dbConfig.ssl
        });
        return;
    }
    console.log('✅ Conectado a la base de datos:', process.env.TIDB_DATABASE || 'la_gran_empresa');
    console.log('📍 Host:', process.env.TIDB_HOST || 'localhost');
});

// RUTA PARA GUARDAR DOCUMENTO COMPLETO
app.post('/api/guardar-documento', (req, res) => {
    const { numero, fecha, tipo, entidad, concepto, movimientos, total } = req.body;

    console.log('Recibiendo documento:', { numero, fecha, tipo, entidad });

    // Insertar en la tabla 'documentos' (Encabezado)
    const sqlDoc = `INSERT INTO documentos (folio, fecha, tipo_movimiento, entidad_nombre, id_concepto, total_documento) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(sqlDoc, [numero, fecha, tipo, entidad, concepto, total], (err, result) => {
        if (err) {
            console.error('Error al guardar encabezado:', err);
            return res.status(500).json({ error: "Error al guardar el encabezado", detalle: err.message });
        }

        const idDocumento = result.insertId;

        // Insertar cada producto en 'movimientos_detalle'
        if (movimientos && movimientos.length > 0) {
            const valoresMovimientos = movimientos.map(m => [
                idDocumento, 
                m.producto,
                m.cantidad, 
                m.precio, 
                m.subtotal
            ]);

            const sqlDetalle = `INSERT INTO movimientos_detalle (id_documento, id_producto, cantidad, precio_unitario, subtotal) 
                                VALUES ?`;

            db.query(sqlDetalle, [valoresMovimientos], (errDetalle) => {
                if (errDetalle) {
                    console.error('Error al guardar detalles:', errDetalle);
                    return res.status(500).json({ error: "Error al guardar los productos", detalle: errDetalle.message });
                }
                res.status(200).json({ 
                    mensaje: "¡Documento y movimientos guardados con éxito!", 
                    id: idDocumento 
                });
            });
        } else {
            res.status(200).json({ 
                mensaje: "Documento guardado sin movimientos", 
                id: idDocumento 
            });
        }
    });
});

// RUTA PARA GUARDAR EN CATÁLOGOS
app.post('/api/catalogos/:tabla', (req, res) => {
    const tabla = req.params.tabla;
    const datos = req.body;

    console.log(`Guardando en catálogo ${tabla}:`, datos);

    const sql = `INSERT INTO ?? SET ?`;
    
    db.query(sql, [tabla, datos], (err, result) => {
        if (err) {
            console.error("Error al guardar en catálogo:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ 
            mensaje: "Registro guardado", 
            id: result.insertId 
        });
    });
});

// RUTA PARA OBTENER CATÁLOGOS
app.get('/api/catalogos/:tabla', (req, res) => {
    const tabla = req.params.tabla;

    const sql = `SELECT * FROM ??`;
    
    db.query(sql, [tabla], (err, results) => {
        if (err) {
            console.error("Error al leer catálogo:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(results);
    });
});

// RUTA DE PRUEBA PARA VERIFICAR CONEXIÓN
app.get('/api/health', (req, res) => {
    db.ping((err) => {
        if (err) {
            res.status(500).json({ 
                status: 'error', 
                message: 'No conectado a la base de datos',
                error: err.message 
            });
        } else {
            res.json({ 
                status: 'ok', 
                message: 'Servidor funcionando y conectado a DB',
                db: process.env.TIDB_DATABASE || 'local'
            });
        }
    });
});

// MANEJO DE ERRORES 404 PARA API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Ruta API no encontrada' });
});

// SIRVIENDO ARCHIVOS ESTÁTICOS (para producción)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
    
    // Para SPA (Single Page Application) - redirigir todo a index.html
    app.get('*', (req, res) => {
        res.sendFile(__dirname + '/public/index.html');
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'desarrollo');
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});
