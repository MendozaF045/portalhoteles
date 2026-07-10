const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const authHotelCtrl = require('../controllers/authHotel.controller');
const estadoCtrl = require('../controllers/hotelEstado.controller');
const habitacionesCtrl = require('../controllers/habitaciones.controller');

const router = express.Router();

router.use(requireAuth, requireRole('hotel'));

router.get('/me', asyncHandler(authHotelCtrl.getMe));
router.put('/me', asyncHandler(authHotelCtrl.updateMe));

router.post('/activar', asyncHandler(estadoCtrl.activar));
router.post('/desactivar', asyncHandler(estadoCtrl.desactivar));

router.get('/habitaciones', asyncHandler(habitacionesCtrl.list));
router.post('/habitaciones', asyncHandler(habitacionesCtrl.create));
router.put('/habitaciones/:id', asyncHandler(habitacionesCtrl.update));
router.delete('/habitaciones/:id', asyncHandler(habitacionesCtrl.remove));

module.exports = router;
