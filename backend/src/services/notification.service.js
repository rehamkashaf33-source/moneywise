const Notification = require('../models/Notification');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');


exports.notifyOnce = async (user, { key, title, message, type = 'info' }) => {
  if (key && (await Notification.exists({ user, key }))) return;
  await Notification.create({ user, key, title, message, type });
};


exports.checkBudget = async (userId, category, date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const budget = await Budget.findOne({ user: userId, category, month, year });
  if (!budget) return;

  const [agg] = await Transaction.aggregate([
    { $match: { user: userId, type: 'expense', category, date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const spent = agg?.total || 0;
  const ratio = spent / budget.limit;
  const tag = `${category}:${year}-${month}`;

  if (ratio >= 1) {
    await exports.notifyOnce(userId, {
      key: `budget-over:${tag}`,
      type: 'warning',
      title: 'Budget exceeded',
      message: `You have spent ${spent.toFixed(2)} on ${category}, above your ${budget.limit.toFixed(2)} budget.`,
    });
  } else if (ratio >= 0.8) {
    await exports.notifyOnce(userId, {
      key: `budget-near:${tag}`,
      type: 'warning',
      title: 'Budget almost used',
      message: `${Math.round(ratio * 100)}% of your ${category} budget is used for this month.`,
    });
  }
};
