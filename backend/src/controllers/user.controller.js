const fs = require('fs/promises');
const path = require('path');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ success: true, user: req.user });
});

exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload');
  const previous = req.user.avatar;
  req.user.avatar = `/uploads/avatars/${req.file.filename}`;
  await req.user.save();
  if (previous) fs.unlink(path.join(__dirname, '../..', previous)).catch(() => {});
  res.json({ success: true, user: req.user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  await RefreshToken.deleteMany({ user: user._id }); // sign out other devices
  res.json({ success: true, message: 'Password changed' });
});
