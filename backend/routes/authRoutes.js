const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('Datos recibidos:', { name, email });

        // Verificar si el usuario ya existe
        const userExists = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const newUser = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, rol_id) VALUES ($1, $2, $3, 3) RETURNING id, nombre, email',
            [name, email, hashedPassword]
        );

        console.log('Usuario creado:', newUser.rows[0]);

        // Al generar el token
        const token = jwt.sign(
            { id: newUser.rows[0].id, email: newUser.rows[0].email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Aumentar el tiempo de expiración
        );

        res.json({
            message: 'Usuario registrado exitosamente',
            user: newUser.rows[0],
            token: token
        });

    } catch (error) {
        console.error('Error detallado:', error);
        res.status(500).json({ error: error.message || 'Error al registrar usuario' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Intento de login:', { email });

        // Buscar usuario
        const result = await pool.query(
            'SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.email = $1',
            [email]
        );

        console.log('Usuario encontrado:', result.rows[0] ? 'Sí' : 'No');

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];
        console.log('Verificando contraseña para:', user.email);

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Contraseña válida:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Crear respuesta sin incluir la contraseña
        const userResponse = {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol_nombre
        };

        console.log('Login exitoso para:', userResponse);

        // Al generar el token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Aumentar el tiempo de expiración
        );

        res.json({
            message: 'Login exitoso',
            user: userResponse,
            token: token
        });

    } catch (error) {
        console.error('Error detallado en login:', error);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
});

module.exports = router;
