const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
});

router.post('/register', limiter, validate(s.register), c.register);
router.post('/login', limiter, validate(s.login), c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.post('/forgot-password', limiter, validate(s.forgot), c.forgotPassword);
router.post('/reset-password', limiter, validate(s.reset), c.resetPassword);
router.post('/verify-email', validate(s.verifyEmail), c.verifyEmail);
router.get('/me', auth, c.me);

module.exports = router;
