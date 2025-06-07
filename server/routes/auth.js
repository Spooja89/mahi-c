const express = require('express');
const ethers = require("ethers");
const User = require('../models/User');

const router = express.Router();

// Step 1: Get nonce - store nonce in DB
router.get('/wallet-nonce/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;

  try {
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({ msg: 'Invalid wallet address' });
    }

    const newNonce = Math.floor(Math.random() * 1000000).toString();
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      // Create new user with nonce
      user = await User.create({
        walletAddress: walletAddress.toLowerCase(),
        nonce: newNonce,
        loginMethod: 'wallet',
        balance: 0,
        referralCode: null,
        referredBy: null,
        username: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
      });
    } else {
      // Update nonce for existing user
      user.nonce = newNonce;
      await user.save();
    }

    res.json({ nonce: user.nonce });
  } catch (err) {
    console.error('Error in /wallet-nonce:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Step 2: Verify signature and login
router.post('/wallet-login', async (req, res) => {
  const { walletAddress, signature } = req.body;

  if (!walletAddress || !signature) {
    return res.status(400).json({ msg: 'Wallet address and signature required' });
  }

  try {
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user || !user.nonce) {
      return res.status(400).json({ msg: 'No nonce found. Request a nonce first.' });
    }

    const message = `Login nonce: ${user.nonce}`;
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ msg: 'Signature verification failed' });
    }

    // Clear nonce after successful login to prevent reuse
    user.nonce = null;
    await user.save();

    res.json({ msg: 'Login successful', user });
  } catch (err) {
    console.error('Error in /wallet-login:', err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

module.exports = router;
