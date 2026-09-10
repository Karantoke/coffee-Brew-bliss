const express = require('express');
const Order   = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/orders — Save a new order ───────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, items, total } = req.body;

    if (!customerName || !customerEmail || !items || !items.length || total == null) {
      return res.status(400).json({ message: 'customerName, customerEmail, items, and total are required' });
    }

    const order = await Order.create({ customerName, customerEmail, items, total });

    res.status(201).json({ message: 'Order placed successfully!', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/orders/my — Get logged-in user's orders (protected) ──────────────
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
