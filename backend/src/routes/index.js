const router = require('express').Router();

router.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/budgets', require('./budget.routes'));
router.use('/goals', require('./goal.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
