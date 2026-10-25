const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success'], default: 'info' },
    key: { type: String }, // used to avoid sending the same alert twice
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ user: 1, createdAt: -1 });
schema.index({ user: 1, key: 1 });

module.exports = mongoose.model('Notification', schema);
