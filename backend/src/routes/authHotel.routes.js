const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/authHotel.controller');

const router = express.Router();

router.post('/registro', asyncHandler(ctrl.registro));
router.post('/login', asyncHandler(ctrl.login));
router.post('/forgot-password', asyncHandler(ctrl.forgotPassword));
router.post('/reset-password', asyncHandler(ctrl.resetPassword));

module.exports = router;
