const Joi = require('joi');
const { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, CURRENCIES } = require('../utils/constants');

const password = Joi.string().min(8).max(72).pattern(/[A-Za-z]/).pattern(/\d/).messages({
  'string.min': 'Password must be at least 8 characters',
  'string.pattern.base': 'Password must contain letters and numbers',
});
const email = Joi.string().email().lowercase().trim().required();
const month = Joi.number().integer().min(1).max(12);
const year = Joi.number().integer().min(2000).max(2100);

exports.register = Joi.object({ name: Joi.string().trim().min(2).max(60).required(), email, password: password.required() });
exports.login = Joi.object({ email, password: Joi.string().required() });
exports.forgot = Joi.object({ email });
exports.reset = Joi.object({ token: Joi.string().required(), password: password.required() });
exports.verifyEmail = Joi.object({ token: Joi.string().required() });
exports.changePassword = Joi.object({ currentPassword: Joi.string().required(), newPassword: password.required() });
exports.profile = Joi.object({ name: Joi.string().trim().min(2).max(60), currency: Joi.string().valid(...CURRENCIES) });

exports.transaction = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  amount: Joi.number().positive().precision(2).max(1e9).required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().when('type', {
    is: 'income',
    then: Joi.valid(...INCOME_CATEGORIES),
    otherwise: Joi.valid(...EXPENSE_CATEGORIES),
  }).required(),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default('cash'),
  note: Joi.string().allow('').max(300).default(''),
  date: Joi.date().default(() => new Date()),
});

exports.transactionQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid('income', 'expense'),
  category: Joi.string(),
  search: Joi.string().allow('').max(100),
  from: Joi.date(),
  to: Joi.date(),
  sort: Joi.string().valid('date', '-date', 'amount', '-amount').default('-date'),
});

exports.monthQuery = Joi.object({ month, year });

exports.budget = Joi.object({
  category: Joi.string().valid(...EXPENSE_CATEGORIES).required(),
  limit: Joi.number().positive().max(1e9).required(),
  month: month.required(),
  year: year.required(),
});
exports.budgetUpdate = Joi.object({ limit: Joi.number().positive().max(1e9).required() });

exports.goal = Joi.object({
  title: Joi.string().trim().min(1).max(100).required(),
  targetAmount: Joi.number().positive().max(1e10).required(),
  currentAmount: Joi.number().min(0).default(0),
  deadline: Joi.date().allow(null, ''),
});
exports.contribute = Joi.object({ amount: Joi.number().positive().max(1e10).required() });

exports.adminUsersQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').max(100),
});
exports.roleUpdate = Joi.object({ role: Joi.string().valid('user', 'admin').required() });
