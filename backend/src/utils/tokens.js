const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const REFRESH_DAYS = 7;
const isProd = process.env.NODE_ENV === 'production';

exports.signAccess = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '15m' });

exports.hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
exports.randomToken = () => crypto.randomBytes(32).toString('hex');

exports.cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
};

/** Creates a refresh token, stores its hash, and sets the httpOnly cookie. */
exports.issueRefresh = async (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_DAYS}d` });
  await RefreshToken.create({
    user: user._id,
    tokenHash: exports.hash(token),
    expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
  });
  res.cookie('refreshToken', token, exports.cookieOptions);
};
