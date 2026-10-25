const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.stats = asyncHandler(async (_req, res) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [users, newUsers, transactions, totals, active] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: monthStart } }),
    Transaction.countDocuments(),
    Transaction.aggregate([{ $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Transaction.distinct('user', { createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
  ]);
  res.json({
    success: true,
    users,
    newUsers,
    transactions,
    activeUsers: active.length,
    totalIncome: totals.find((t) => t._id === 'income')?.total || 0,
    totalExpense: totals.find((t) => t._id === 'expense')?.total || 0,
  });
});

exports.users = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const filter = search ? { $or: [{ name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] } : {};
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

exports.setRole = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new ApiError(400, "You can't change your own role");
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ success: true, data: user });
});

exports.removeUser = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new ApiError(400, "You can't delete your own account here");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const where = { user: user._id };
  await Promise.all([Transaction, Budget, Goal, Notification, RefreshToken].map((M) => M.deleteMany(where)));
  res.json({ success: true });
});
