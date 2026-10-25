const router = require('express').Router();
const c = require('../controllers/goal.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth);
router.route('/').get(c.list).post(validate(s.goal), c.create);
router.route('/:id').put(validate(s.goal), c.update).delete(c.remove);
router.patch('/:id/contribute', validate(s.contribute), c.contribute);

module.exports = router;
