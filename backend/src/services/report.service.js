const Transaction = require('../models/Transaction');

exports.monthRange = (month, year) => {
  const now = new Date();
  const m = Number(month) || now.getMonth() + 1;
  const y = Number(year) || now.getFullYear();
  return { month: m, year: y, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
};

exports.monthlyReport = async (userId, month, year) => {
  const range = exports.monthRange(month, year);
  const transactions = await Transaction.find({ user: userId, date: { $gte: range.start, $lt: range.end } })
    .sort({ date: -1 })
    .lean();

  let income = 0;
  let expense = 0;
  const byCategory = {};
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else {
      expense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }
  const categories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total, percent: expense ? +((total / expense) * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.total - a.total);

  return {
    month: range.month,
    year: range.year,
    income,
    expense,
    balance: income - expense,
    savingRate: income > 0 ? +(((income - expense) / income) * 100).toFixed(1) : 0,
    categories,
    transactions,
  };
};
