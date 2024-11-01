const { pool } = require('../db.js');
const bcrypt = require('bcrypt');

class User {
    static async create(name, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO users (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email
        `;
        const values = [name, email, hashedPassword];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            if (error.code === '23505') {
                throw new Error('El correo electrónico ya está registrado');
            }
            throw error;
        }
    }

    static async authenticate(email, password) {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await pool.query(query, [email]);
        const user = result.rows[0];

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new Error('Contraseña incorrecta');
        }

        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}

module.exports = User; 