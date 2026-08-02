'use strict';

const express = require('express');
const router  = express.Router();

const webhookController = require('../controllers/WebhookController');

/**
 * @swagger
 * /api/webhooks/aisensy:
 *   post:
 *     summary: AI Sensy WhatsApp webhook endpoint
 *     description: Receives incoming WhatsApp messages and status updates from AI Sensy. Always returns HTTP 200 immediately.
 *     tags: [Webhook]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:      { type: string, example: "message.received" }
 *               created_at: { type: number }
 *               data:
 *                 type: object
 *                 properties:
 *                   from:     { type: string, example: "919876543210" }
 *                   userName: { type: string }
 *                   message:
 *                     type: object
 *                     properties:
 *                       type: { type: string, example: "text" }
 *                       text: { type: string, example: "hi" }
 *     responses:
 *       200: { description: "Webhook received" }
 */
router.post('/aisensy', (req, res) => webhookController.handleWebhook(req, res));

module.exports = router;
