const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireAuth, requireRole('super_admin'));

router.get('/hoteles/activos', asyncHandler(ctrl.listActivos));
router.get('/hoteles/inactivos', asyncHandler(ctrl.listInactivos));
router.post('/hoteles', asyncHandler(ctrl.addHotel));
router.delete('/hoteles/:id', asyncHandler(ctrl.deleteHotel));

module.exports = router;
