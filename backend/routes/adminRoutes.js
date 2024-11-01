const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/authorizationMiddleware');

const router = express.Router();

// Ruta de Administración
router.get('/administracion', authenticateToken, authorizeRoles(1), (req, res) => { // 1 = Administrador
  res.json({ adminData: 'Datos administrativos' });
});

// Ruta para Reportes Administrativos
router.get('/reportes', authenticateToken, authorizeRoles(1), (req, res) => { // 1 = Administrador
  res.json({ reportes: 'Datos de reportes administrativos' });
});

// Otras rutas de administración...
// Asegúrate de utilizar el role_id correcto para cada función administrativa

module.exports = router;
