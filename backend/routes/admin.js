const express  = require('express');
const User     = require('../models/User');
const Order    = require('../models/Order');
const Contact  = require('../models/Contact');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require a valid JWT AND admin role
router.use(protect, adminOnly);

// ── GET /api/admin/dashboard — Aggregate stats ────────────────────────────────
router.get('/dashboard', async (_req, res) => {
  try {
    const [totalUsers, totalOrders, contacts, revenueAgg] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalOrders,
      newMessages:   contacts,
      totalRevenue:  revenueAgg[0]?.total ?? 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/orders — All orders ───────────────────────────────────────
router.get('/orders', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/admin/orders/:id — Update order status ────────────────────────
router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed    = ['pending', 'processing', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/contacts — All contact messages ───────────────────────────
router.get('/contacts', async (_req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/admin/users — All users ─────────────────────────────────────────
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
