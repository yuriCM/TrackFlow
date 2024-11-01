// Agregar manejo de errores global
process.on('uncaughtException', (error) => {
    console.error('Error no capturado:', error);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Prueba de conexión a la base de datos
pool.connect()
    .then(() => console.log('Conexión a la base de datos establecida'))
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err);
        process.exit(1);
    });

// Rutas básicas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Importar y usar las rutas de autenticación
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Ruta básica al final
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto
const port = process.env.PORT || 3000;

// Iniciar servidor con manejo de errores
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}).on('error', (error) => {
    console.error('Error al iniciar el servidor:', error);
});

