const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  loginMethod: { type: String, enum: ['wallet', 'google'], required: true },
  walletAddress: { type: String, unique: true, sparse: true }, // use walletAddress consistently
  nonce: { type: String, default: null },  // nonce must be here
  googleEmail: { type: String, default: null },
  displayName: { type: String, default: null },
  balance: { type: Number, default: 0 },
  referralCode: { type: String, default: null },
  referredBy: { type: String, default: null },
  email: { type: String, unique: true, sparse: true },
  username: String,
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
