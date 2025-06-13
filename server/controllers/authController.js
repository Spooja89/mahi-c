// backend/controllers/authController.js
const generateReferralCode = require("../utils/RSferral");

async function register(req, res) {
  const { email, username, password, referredBy } = req.body;

  const referralCode = generateReferralCode();
  const user = new User({ email, username, password, referralCode });

  if (referredBy) {
    user.referredBy = referredBy;
    // optional: update earnings for referrer
    const referrer = await User.findOne({ referralCode: referredBy });
    if (referrer) {
      referrer.earnings += 5; // bonus
      await referrer.save();
    }
  }

  await user.save();
  res.status(201).json({ message: "User registered", referralCode });
}
