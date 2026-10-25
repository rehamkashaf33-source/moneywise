const router = require('express').Router();
const c = require('../controllers/budget.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth);
router.route('/').get(validate(s.monthQuery, 'query'), c.list).post(validate(s.budget), c.create);
router.route('/:id').put(validate(s.budgetUpdate), c.update).delete(c.remove);

module.exports = router;
