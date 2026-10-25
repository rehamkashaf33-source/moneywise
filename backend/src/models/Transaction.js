const mongoose = require('mongoose');
const { PAYMENT_METHODS } = require('../utils/constants');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    note: { type: String, default: '', maxlength: 300 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ user: 1, date: -1 });
schema.index({ user: 1, type: 1, category: 1, date: -1 });

module.exports = mongoose.model('Transaction', schema);
