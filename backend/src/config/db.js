const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[key]) throw new Error(`${key} is not set`);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
