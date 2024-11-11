const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

// Agregar listener para errores de conexión
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de conexiones:', err);
});

module.exports = pool;

