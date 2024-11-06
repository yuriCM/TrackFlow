const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const maquinasRouter = require('./routes/maquinas');

// Cargar variables de entorno
dotenv.config();

// Configurar la conexión a la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de autenticación
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email
        `;
        const result = await pool.query(query, [name, email, hashedPassword]);
        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        if (error.code === '23505') {
            res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas de máquinas
app.use('/', maquinasRouter);

// Mantener el código existente para el manejo del frontend
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a los elementos del DOM
    const loginCard = document.getElementById('loginForm')?.parentElement?.parentElement;
    const registroCard = document.getElementById('registro-form');
    const showRegistroLink = document.getElementById('show-registro');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');

    // Toggle entre formularios
    if (showRegistroLink && showLoginLink) {
        showRegistroLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'none';
            registroCard.style.display = 'block';
        });

        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginCard.style.display = 'block';
            registroCard.style.display = 'none';
        });
    }

    // Toggle password visibility
    const togglePasswords = document.querySelectorAll('.toggle-password');
    togglePasswords.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    });

    // Login form handling
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error);
                }

                localStorage.setItem('currentUser', JSON.stringify(data.user));
                window.location.href = 'tareas.html';
            } catch (error) {
                alert('Error al iniciar sesión: ' + error.message);
            }
        });
    }

    // Registration form handling
    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirmPassword').value;

            try {
                if (password !== confirmPassword) {
                    alert('Las contraseñas no coinciden');
                    return;
                }

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error);
                }

                alert('Registro exitoso. Por favor inicia sesión.');
                registroForm.reset();
                loginCard.style.display = 'block';
                registroCard.style.display = 'none';
            } catch (error) {
                alert('Error al registrar: ' + error.message);
            }
        });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
}); 