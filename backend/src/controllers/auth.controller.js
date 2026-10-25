const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { signAccess, issueRefresh, hash, randomToken, cookieOptions } = require('../utils/tokens');

const clientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];

const session = async (res, user, status = 200) => {
  await issueRefresh(res, user);
  res.status(status).json({ success: true, accessToken: signAccess(user), user });
};

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  const verifyToken = randomToken();
  const user = await User.create({ name, email, password, verificationToken: hash(verifyToken) });

  const link = `${clientUrl()}/verify-email?token=${verifyToken}`;
  sendEmail({
    to: email,
    subject: 'Verify your email',
    text: `Hi ${name}, confirm your email address: ${link}`,
    html: `<p>Hi ${name},</p><p><a href="${link}">Confirm your email address</a></p>`,
  });
  await session(res, user, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Incorrect email or password');
  await session(res, user);
});

exports.refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const fail = () => {
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    throw new ApiError(401, 'Please sign in again');
  };
  if (!token) return fail();

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return fail();
  }
  // Rotation: a refresh token works exactly once.
  const stored = await RefreshToken.findOneAndDelete({ tokenHash: hash(token), user: payload.id });
  if (!stored) return fail();
  const user = await User.findById(payload.id);
  if (!user) return fail();
  await session(res, user);
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) await RefreshToken.deleteOne({ tokenHash: hash(token) });
  res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true });
});

exports.me = (req, res) => res.json({ success: true, user: req.user });

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = randomToken();
    user.resetPasswordToken = hash(token);
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    const link = `${clientUrl()}/reset-password?token=${token}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your password',
      text: `Use this link within 30 minutes to reset your password: ${link}`,
      html: `<p><a href="${link}">Reset your password</a> (valid for 30 minutes)</p>`,
    });
  }
  // Same answer whether or not the account exists, so emails can't be probed.
  res.json({ success: true, message: 'If that email is registered, a reset link is on its way.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hash(req.body.token),
    resetPasswordExpire: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpire');
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  await RefreshToken.deleteMany({ user: user._id });
  res.json({ success: true, message: 'Password updated. You can sign in now.' });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ verificationToken: hash(req.body.token) }).select('+verificationToken');
  if (!user) throw new ApiError(400, 'This verification link is invalid');
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  res.json({ success: true, message: 'Email verified' });
});
