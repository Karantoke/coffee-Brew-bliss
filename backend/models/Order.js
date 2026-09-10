const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    id:    { type: String, required: true },
    name:  { type: String, required: true },
    price: { type: Number, required: true },
    qty:   { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customerName:  { type: String, required: [true, 'Customer name is required'], trim: true },
    customerEmail: { type: String, required: [true, 'Customer email is required'], lowercase: true, trim: true },
    items:         { type: [OrderItemSchema], required: true },
    total:         { type: Number, required: [true, 'Order total is required'], min: 0 },
    status: {
      type:    String,
      enum:    ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
