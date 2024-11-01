const express = require('express');
const authenticateToken = require('../middleware/authMiddleware');
const pool = require('../db');

const router = express.Router();

// Ruta de Dashboard Técnico
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: 'Bienvenido al Dashboard de Técnico' });
});

// Ruta para Registrar Cambios de Repuestos
router.post('/registro', authenticateToken, async (req, res) => {
  const { repuesto_id, descripcion, fecha } = req.body;

  if (!repuesto_id || !descripcion || !fecha) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  try {
    // Asumiendo que tienes una tabla llamada 'cambios_repuestos'
    const resultado = await pool.query(
      'INSERT INTO cambios_repuestos (repuesto_id, descripcion, fecha, usuario_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [repuesto_id, descripcion, fecha, req.user.id]
    );

    res.status(201).json({ message: 'Cambio registrado exitosamente.', cambio: resultado.rows[0] });
  } catch (error) {
    console.error('Error al registrar cambio:', error.message);
    res.status(500).json({ error: 'Error al registrar el cambio.' });
  }
});

// Ruta para Obtener Historial de Cambios
router.get('/historial', authenticateToken, async (req, res) => {
  try {
    const historial = await pool.query(
      'SELECT * FROM cambios_repuestos WHERE usuario_id = $1 ORDER BY fecha DESC',
      [req.user.id]
    );
    res.json({ historial: historial.rows });
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
});

// Ruta para Obtener Estadísticas
router.get('/estadisticas', authenticateToken, async (req, res) => {
  try {
    const totalCambios = await pool.query(
      'SELECT COUNT(*) FROM cambios_repuestos WHERE usuario_id = $1',
      [req.user.id]
    );
    const tiempoPromedio = await pool.query(
      'SELECT AVG(extract(epoch from (fecha - lag(fecha) OVER (ORDER BY fecha)))) AS tiempo_promedio FROM cambios_repuestos WHERE usuario_id = $1',
      [req.user.id]
    );

    res.json({
      totalCambios: totalCambios.rows[0].count,
      tiempoPromedio: tiempoPromedio.rows[0].tiempo_promedio,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error.message);
    res.status(500).json({ error: 'Error al obtener las estadísticas.' });
  }
});

// Ruta para Gestionar Inventario de Repuestos
router.get('/inventario', authenticateToken, async (req, res) => {
  try {
    const inventario = await pool.query('SELECT * FROM inventario_repuestos ORDER BY nombre');
    res.json({ inventario: inventario.rows });
  } catch (error) {
    console.error('Error al obtener inventario:', error.message);
    res.status(500).json({ error: 'Error al obtener el inventario.' });
  }
});

// Otras rutas específicas para Técnico...

module.exports = router;
