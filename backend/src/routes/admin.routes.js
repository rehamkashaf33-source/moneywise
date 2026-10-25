const router = require('express').Router();
const c = require('../controllers/admin.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const s = require('../validators/schemas');

router.use(auth, admin);
router.get('/stats', c.stats);
router.get('/users', validate(s.adminUsersQuery, 'query'), c.users);
router.put('/users/:id/role', validate(s.roleUpdate), c.setRole);
router.delete('/users/:id', c.removeUser);

module.exports = router;
