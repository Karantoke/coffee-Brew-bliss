const express = require('express');
const Contact = require('../models/Contact');

const router = express.Router();

// ── POST /api/contact ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'name, email and message are required' });
    }

    const contact = await Contact.create({ name, email, message });

    res.status(201).json({ message: 'Message received! We will be in touch soon.', id: contact._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
