const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { checkBudget } = require('../services/notification.service');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, type, category, search, from, to, sort } = req.query;
  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = new Date(new Date(to).setHours(23, 59, 59, 999));
  }
  const sortBy = sort.startsWith('-') ? { [sort.slice(1)]: -1, createdAt: -1 } : { [sort]: 1 };

  const [data, total] = await Promise.all([
    Transaction.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

exports.getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) throw new ApiError(404, 'Transaction not found');
  res.json({ success: true, data: tx });
});

exports.create = asyncHandler(async (req, res) => {
  const tx = await Transaction.create({ ...req.body, user: req.user._id });
  if (tx.type === 'expense') await checkBudget(req.user._id, tx.category, tx.date);
  res.status(201).json({ success: true, data: tx });
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!tx) throw new ApiError(404, 'Transaction not found');
  if (tx.type === 'expense') await checkBudget(req.user._id, tx.category, tx.date);
  res.json({ success: true, data: tx });
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw new ApiError(404, 'Transaction not found');
  res.json({ success: true });
});
