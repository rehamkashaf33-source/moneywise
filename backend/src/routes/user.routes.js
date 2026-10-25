const router = require('express').Router();
const c = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const s = require('../validators/schemas');

router.use(auth);
router.put('/profile', validate(s.profile), c.updateProfile);
router.put('/avatar', upload.single('avatar'), c.updateAvatar);
router.put('/change-password', validate(s.changePassword), c.changePassword);

module.exports = router;
