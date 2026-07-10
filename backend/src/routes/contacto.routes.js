const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/contacto.controller');

const router = express.Router();

router.post('/', asyncHandler(ctrl.crear));

module.exports = router;
