const router = require('express').Router();
const c = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', c.list);
router.put('/read-all', c.markAllRead);
router.put('/:id/read', c.markRead);

module.exports = router;
