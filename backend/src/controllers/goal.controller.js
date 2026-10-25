const Goal = require('../models/Goal');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyOnce } = require('../services/notification.service');

const announceIfDone = (goal) =>
  goal.completed &&
  notifyOnce(goal.user, {
    key: `goal-done:${goal._id}`,
    type: 'success',
    title: 'Goal achieved',
    message: `You reached your goal "${goal.title}". Well done!`,
  });

exports.list = asyncHandler(async (req, res) => {
  const data = await Goal.find({ user: req.user._id }).sort({ completed: 1, createdAt: -1 });
  res.json({ success: true, data });
});

exports.create = asyncHandler(async (req, res) => {
  const body = { ...req.body, deadline: req.body.deadline || undefined };
  const goal = new Goal({ ...body, user: req.user._id });
  goal.completed = goal.currentAmount >= goal.targetAmount;
  await goal.save();
  await announceIfDone(goal);
  res.status(201).json({ success: true, data: goal });
});

exports.update = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  Object.assign(goal, req.body, { deadline: req.body.deadline || undefined });
  goal.completed = goal.currentAmount >= goal.targetAmount;
  await goal.save();
  await announceIfDone(goal);
  res.json({ success: true, data: goal });
});

exports.contribute = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  goal.currentAmount += req.body.amount;
  goal.completed = goal.currentAmount >= goal.targetAmount;
  await goal.save();
  await announceIfDone(goal);
  res.json({ success: true, data: goal });
});

exports.remove = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!goal) throw new ApiError(404, 'Goal not found');
  res.json({ success: true });
});
