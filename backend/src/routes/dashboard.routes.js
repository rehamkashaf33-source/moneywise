const router = require('express').Router();
const c = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.get('/', auth, validate(s.monthQuery, 'query'), c.get);

module.exports = router;
