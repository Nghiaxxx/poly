const express = require('express');
const router = express.Router();
const UserEvent = require('../models/userEventModel');

// POST /api/track-event
router.post('/', async (req, res) => {
  const { userId, eventType, productId, searchKeyword } = req.body;
  if (!userId || !eventType) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    await UserEvent.create({ userId, eventType, productId, searchKeyword });

    // Chỉ tracking hành vi, không tạo voucher behavior nữa
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save event' });
  }
});

module.exports = router; 