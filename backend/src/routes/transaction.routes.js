const router = require('express').Router();
const c = require('../controllers/transaction.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth);
router.route('/').get(validate(s.transactionQuery, 'query'), c.list).post(validate(s.transaction), c.create);
router.route('/:id').get(c.getOne).put(validate(s.transaction), c.update).delete(c.remove);

module.exports = router;
