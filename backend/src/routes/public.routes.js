const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/public.controller');

const router = express.Router();

router.get('/hoteles', asyncHandler(ctrl.listHoteles));

module.exports = router;
