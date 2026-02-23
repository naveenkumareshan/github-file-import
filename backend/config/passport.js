const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token
const generateJWT = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Setup Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in database
    let user = await User.findOne({ 
      $or: [
        { email: profile.emails[0].value },
        { socialId: profile.id, socialProvider: 'google' }
      ]
    });

    // If user doesn't exist, create a new one
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'student',
        socialProvider: 'google',
        socialId: profile.id,
        profilePicture: profile.photos?.[0]?.value || '',
        phone: '',
        gender: '',
        password: require('crypto').randomBytes(16).toString('hex')
      });
    } 
    // If user exists but hasn't linked Google account
    else if (!user.socialId || !user.socialProvider) {
      user.socialProvider = 'google';
      user.socialId = profile.id;
      if (profile.photos && profile.photos[0].value) {
        user.profilePicture = profile.photos[0].value;
      }
      await user.save();
    }

    // Generate JWT token using the model method
    const token = user.getSignedJwtToken();        
    // Return user object with token
    return done(null, { 
      ...user.toJSON(), 
      token 
    });
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport