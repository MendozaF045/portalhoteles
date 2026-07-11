const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/public.controller');
const reservasCtrl = require('../controllers/reservas.controller');

const router = express.Router();

router.get('/hoteles', asyncHandler(ctrl.listHoteles));
router.get('/hoteles/:slug', asyncHandler(ctrl.getHotelPublico));
router.get('/destinos', asyncHandler(ctrl.listDestinos));
router.get('/banner', asyncHandler(ctrl.getBannerActivo));
router.post('/hoteles/:slug/reservas', asyncHandler(reservasCtrl.crearReserva));

module.exports = router;
