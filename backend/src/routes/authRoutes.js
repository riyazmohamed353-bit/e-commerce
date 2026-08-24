const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateProfile,
} = require('../controllers/authController');

// Authentication
router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Logged-in user
router.get('/me', auth, me);
router.patch('/profile', auth, updateProfile);

module.exports = router;