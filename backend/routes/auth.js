const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  changePassword,
  updateUserData,
  registerManager,
  forgotPassword,
  resetPassword,
  validateResetToken
} = require('../controllers/auth');

const {
  socialLogin,
  linkSocialAccount,
  googleCallback,
  facebookCallback,
  verifyGoogleToken,
  verifyFacebookToken
} = require('../controllers/socialAuth');

const passport = require('passport');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/register-manager', registerManager);
router.post('/social-login', socialLogin);
router.post('/google-token', verifyGoogleToken);
router.post('/facebook-token', verifyFacebookToken);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

// Google OAuth routes - Updated to fix the callback issue
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Fixed Google callback route
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=auth_failed`
  }, (err, user, info) => {
    if (err) {
      console.error('Google OAuth error:', err);
      return res.redirect(`${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=auth_error`);
    }
    
    if (!user) {
      console.log('Google OAuth failed:', info);
      return res.redirect(`${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=auth_failed`);
    }
    req.user = user;
    // Call the googleCallback function
    return googleCallback(req, res, next);
  })(req, res, next);
});

// OAuth callback routes (legacy routes maintained for compatibility)
router.get('/google-callback', googleCallback);
router.get('/facebook-callback', facebookCallback);
router.get('/google-login', (req, res) => {
  // Redirect to the Google OAuth URL using passport
  res.redirect('/api/auth/google');
});
router.get('/facebook-login', (req, res) => {
  // In a real app, this would redirect to the Facebook OAuth URL
  res.redirect('/api/auth/facebook-callback');
});

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.post('/change-password', changePassword);
router.post('/update-userdata', updateUserData);
router.post('/link-social', linkSocialAccount);

module.exports = router;