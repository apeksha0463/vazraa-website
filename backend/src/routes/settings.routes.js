'use strict';

const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/SettingsController');

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get application configuration
 *     tags: [Settings]
 *     security: []
 *     responses:
 *       200: { description: "App settings" }
 */
router.get('/', (req, res) => settingsController.getSettings(req, res));

module.exports = router;
