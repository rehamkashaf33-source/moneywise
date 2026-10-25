/* Usage: npm run seed  -> creates demo data.
   demo@example.com / Demo1234   (user)
   admin@example.com / Admin1234 (admin) */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const Budget = require('../src/models/Budget');
const Goal = require('../src/models/Goal');
const Notification = require('../src/models/Notification');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const emails = ['demo@example.com', 'admin@example.com'];
  const old = await User.find({ email: { $in: emails } });
  for (const u of old) await Promise.all([Transaction, Budget, Goal, Notification].map((M) => M.deleteMany({ user: u._id })));
  await User.deleteMany({ email: { $in: emails } });

  const demo = await User.create({ name: 'Demo User', email: emails[0], password: 'Demo1234', isVerified: true });
  await User.create({ name: 'Admin', email: emails[1], password: 'Admin1234', role: 'admin', isVerified: true });

  const now = new Date();
  const expenses = {
    Food: ['Groceries', 'Restaurant', 'Coffee'],
    Transportation: ['Fuel', 'Metro card', 'Taxi'],
    Housing: ['Rent', 'Internet'],
    Entertainment: ['Cinema', 'Streaming'],
    Shopping: ['Clothes', 'Electronics'],
    Health: ['Pharmacy'],
    Bills: ['Electricity', 'Water'],
  };
  const docs = [];
  for (let m = 0; m < 6; m++) {
    const at = (day) => new Date(now.getFullYear(), now.getMonth() - m, day, 12);
    docs.push({ title: 'Monthly salary', amount: 4200, type: 'income', category: 'Salary', paymentMethod: 'bank', date: at(1) });
    if (m % 2 === 0) docs.push({ title: 'Freelance project', amount: rand(300, 900), type: 'income', category: 'Freelance', paymentMethod: 'bank', date: at(12) });
    docs.push({ title: 'Rent', amount: 1100, type: 'expense', category: 'Housing', paymentMethod: 'bank', date: at(2) });
    for (let i = 0; i < 12; i++) {
      const category = pick(Object.keys(expenses).filter((c) => c !== 'Housing'));
      const day = Math.min(1 + Math.floor(Math.random() * 27), m === 0 ? now.getDate() : 28);
      docs.push({ title: pick(expenses[category]), amount: rand(8, 160), type: 'expense', category, paymentMethod: pick(['cash', 'card', 'wallet']), date: at(day) });
    }
  }
  await Transaction.insertMany(docs.filter((d) => d.date <= now).map((d) => ({ ...d, user: demo._id })));

  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  await Budget.insertMany([
    { category: 'Food', limit: 400 },
    { category: 'Transportation', limit: 200 },
    { category: 'Entertainment', limit: 120 },
    { category: 'Shopping', limit: 250 },
  ].map((b) => ({ ...b, user: demo._id, month, year })));

  await Goal.insertMany([
    { user: demo._id, title: 'New laptop', targetAmount: 1800, currentAmount: 650, deadline: new Date(year, month + 3, 1) },
    { user: demo._id, title: 'Emergency fund', targetAmount: 5000, currentAmount: 3200 },
  ]);

  console.log('Seeded. Sign in with demo@example.com / Demo1234 or admin@example.com / Admin1234');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
