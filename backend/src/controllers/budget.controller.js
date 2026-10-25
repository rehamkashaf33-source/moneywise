const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { monthRange } = require('../services/report.service');
const { checkBudget } = require('../services/notification.service');

exports.list = asyncHandler(async (req, res) => {
  const { month, year, start, end } = monthRange(req.query.month, req.query.year);
  const [budgets, spent] = await Promise.all([
    Budget.find({ user: req.user._id, month, year }).sort('category').lean(),
    Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);
  const spentBy = Object.fromEntries(spent.map((s) => [s._id, s.total]));
  res.json({ success: true, data: budgets.map((b) => ({ ...b, spent: spentBy[b.category] || 0 })) });
});

exports.create = asyncHandler(async (req, res) => {
  const { category, month, year } = req.body;
  if (await Budget.exists({ user: req.user._id, category, month, year })) {
    throw new ApiError(409, `You already have a ${category} budget for this month`);
  }
  const budget = await Budget.create({ ...req.body, user: req.user._id });
  await checkBudget(req.user._id, category, new Date(year, month - 1, 1));
  res.status(201).json({ success: true, data: budget });
});

exports.update = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { limit: req.body.limit }, { new: true });
  if (!budget) throw new ApiError(404, 'Budget not found');
  res.json({ success: true, data: budget });
});

exports.remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) throw new ApiError(404, 'Budget not found');
  res.json({ success: true });
});
