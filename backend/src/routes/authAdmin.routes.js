const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/authAdmin.controller');

const router = express.Router();

router.post('/login', asyncHandler(ctrl.login));

module.exports = router;
