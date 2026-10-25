export const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
export const PAYMENT_METHODS = ['cash', 'card', 'wallet', 'bank'];
export const CURRENCIES = ['USD', 'EUR', 'EGP', 'SAR', 'AED', 'GBP'];

export const CATEGORY_COLORS = {
  Food: '#ff6384', Transportation: '#339af0', Housing: '#ffd24d', Entertainment: '#38c6b5', Shopping: '#9775fa',
  Health: '#ff922b', Education: '#74c0fc', Bills: '#868e96', Other: '#adb5bd',
};
export const colorFor = (c) => CATEGORY_COLORS[c] || '#adb5bd';

export const money = (n, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const toInputDate = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const toInputMonth = (d = new Date()) => toInputDate(d).slice(0, 7);
export const parseMonth = (value) => { const [year, month] = value.split('-').map(Number); return { year, month }; };
export const initials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
