const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const asyncHandler = require('../utils/asyncHandler');
const { monthRange } = require('../services/report.service');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const totalsByType = (rows) => ({
  income: rows.find((r) => r._id === 'income')?.total || 0,
  expense: rows.find((r) => r._id === 'expense')?.total || 0,
});

exports.get = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const { month, year, start, end } = monthRange(req.query.month, req.query.year);
  const trendStart = new Date(year, month - 6, 1);

  const [allTime, monthly, categories, trendRows, recent, budgets] = await Promise.all([
    Transaction.aggregate([{ $match: { user: uid } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: start, $lt: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: uid, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: uid, date: { $gte: trendStart, $lt: end } } },
      { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]),
    Transaction.find({ user: uid }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    Budget.find({ user: uid, month, year }).lean(),
  ]);

  const all = totalsByType(allTime);
  const current = totalsByType(monthly);

  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    const pick = (type) => trendRows.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1 && r._id.type === type)?.total || 0;
    trend.push({ label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, income: pick('income'), expense: pick('expense') });
  }

  const spentBy = Object.fromEntries(categories.map((c) => [c._id, c.total]));
  res.json({
    success: true,
    month,
    year,
    balance: all.income - all.expense,
    income: current.income,
    expense: current.expense,
    savingRate: current.income > 0 ? +(((current.income - current.expense) / current.income) * 100).toFixed(1) : 0,
    categories: categories.map((c) => ({ category: c._id, total: c.total })),
    trend,
    recent,
    budgets: budgets.map((b) => ({ category: b.category, limit: b.limit, spent: spentBy[b.category] || 0 })),
  });
});
