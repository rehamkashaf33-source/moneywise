const router = require('express').Router();
const c = require('../controllers/report.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth, validate(s.monthQuery, 'query'));
router.get('/monthly', c.monthly);
router.get('/excel', c.excel);
router.get('/pdf', c.pdf);

module.exports = router;
