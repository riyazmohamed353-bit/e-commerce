const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, sendOtpEmail } = require('../services/emailService');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    pincode: user.pincode,
    city: user.city,
    emailVerified: user.emailVerified,
    trustScore: user.getTrustScore(),
  };
}

// POST /api/auth/register
// Creates an unverified account and emails a 6-digit OTP. No token is
// issued yet - the client must call /verify-otp first.
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing && existing.emailVerified) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);

    let user;
    if (existing && !existing.emailVerified) {
      // Previous signup never verified - overwrite with the new attempt.
      Object.assign(existing, { name, password: hashed, phone, otpCode: otp, otpPurpose: 'verify', otpExpires });
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashed,
        phone,
        otpCode: otp,
        otpPurpose: 'verify',
        otpExpires,
      });
    }

    await sendOtpEmail(email, otp, 'verify');

    res.status(201).json({
      message: 'Verification code sent to your email',
      email: user.email,
      requiresOtp: true,
    });
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/verify-otp  { email, otp }
// Confirms the code from /register (or a resend) and logs the user in.
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'email and otp are required' });

    const user = await User.findOne({ email }).select('+otpCode +otpPurpose +otpExpires');
    if (!user || user.otpPurpose !== 'verify') {
      return res.status(400).json({ message: 'No pending verification for this email' });
    }
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Incorrect code' });
    }

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpPurpose = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/resend-otp  { email, purpose: 'verify' | 'reset' }
exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose = 'verify' } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });
    if (purpose === 'verify' && user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpPurpose = purpose === 'reset' ? 'reset' : 'verify';
    user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(email, otp, user.otpPurpose);
    res.json({ message: 'A new code has been sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.emailVerified) {
      // Resend a fresh code so the user can finish onboarding immediately.
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpPurpose = 'verify';
      user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
      await user.save();
      await sendOtpEmail(email, otp, 'verify');
      return res.status(403).json({
        message: 'Please verify your email first. A new code has been sent.',
        requiresOtp: true,
        email: user.email,
      });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password  { email }
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond 200 even if the email doesn't exist, so the endpoint
    // can't be used to enumerate registered accounts.
    if (user) {
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpPurpose = 'reset';
      user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
      await user.save();
      await sendOtpEmail(email, otp, 'reset');
    }
    res.json({ message: 'If that email is registered, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password  { email, otp, newPassword }
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'email, otp and newPassword are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+otpCode +otpPurpose +otpExpires');
    if (!user || user.otpPurpose !== 'reset') {
      return res.status(400).json({ message: 'No pending reset for this email' });
    }
    if (!user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Incorrect code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = undefined;
    user.otpPurpose = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({ message: 'Password updated', token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(publicUser(user));
};

// PATCH /api/auth/profile  { name?, phone?, pincode?, city? }
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, pincode, city } = req.body;
    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (pincode !== undefined) user.pincode = pincode;
    if (city !== undefined) user.city = city;
    await user.save();

    res.json(publicUser(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/users/:id
// Public-safe profile info for viewing OTHER users (e.g. from a chat
// conversation). Deliberately excludes email, phone, and anything else
// from publicUser() that's only appropriate for the logged-in user
// themselves.
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      trustScore: user.getTrustScore(),
      memberSince: user.createdAt,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      successfulSales: user.successfulSales,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};