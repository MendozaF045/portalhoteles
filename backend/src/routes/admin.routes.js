const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/admin.controller');
const destinosCtrl = require('../controllers/adminDestinos.controller');
const contactoCtrl = require('../controllers/contacto.controller');

const router = express.Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/hoteles/activos', asyncHandler(ctrl.listActivos));
router.get('/hoteles/inactivos', asyncHandler(ctrl.listInactivos));
router.post('/hoteles', asyncHandler(ctrl.addHotel));
router.delete('/hoteles/:id', asyncHandler(ctrl.deleteHotel));

router.get('/destinos', asyncHandler(destinosCtrl.list));
router.post('/destinos', asyncHandler(destinosCtrl.create));
router.put('/destinos/:id', asyncHandler(destinosCtrl.update));
router.delete('/destinos/:id', asyncHandler(destinosCtrl.remove));
router.post('/destinos/refresh', asyncHandler(destinosCtrl.refresh));

router.get('/contactos', asyncHandler(contactoCtrl.list));

module.exports = router;
