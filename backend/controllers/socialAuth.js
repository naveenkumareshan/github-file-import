const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// @desc    Social login/register
// @route   POST /api/auth/social-login
// @access  Public
exports.socialLogin = async (req, res) => {
  try {
    const { name, email, provider, providerId, profilePicture, accessToken, idToken } = req.body;

    if (!name || !email || !provider || !providerId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // Update social information if needed
      if (!user.socialProvider || user.socialProvider !== provider || user.socialId !== providerId) {
        user.socialProvider = provider;
        user.socialId = providerId;
        user.password = require('crypto').randomBytes(16).toString('hex');
        if (profilePicture) {
          user.profilePicture = profilePicture;
        }
        await user.save();
      }
    } else {
      const password = require('crypto').randomBytes(16).toString('hex');
      // Create new user
      user = await User.create({
        name,
        email,
        role: 'student', // Default role for social logins
        socialProvider: provider,
        socialId: providerId,
        profilePicture: profilePicture || '',
        phone: '',
        gender: '',
        password
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Link social account to existing account
// @route   POST /api/auth/link-social
// @access  Private
exports.linkSocialAccount = async (req, res) => {
  try {
    const { provider, providerId, token, profilePicture } = req.body;
    
    // Get user from token
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update social information
    user.socialProvider = provider;
    user.socialId = providerId;
    
    // Update profile picture if provided
    if (profilePicture) {
      user.profilePicture = profilePicture;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Social account linked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Link social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify Google token and login/register user
// @route   POST /api/auth/google-token
// @access  Public
exports.verifyGoogleToken = async (req, res) => {
  try {
    const { idToken, userData } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'No ID token provided'
      });
    }
    
    // In a production app, you would verify the token with Google's API
    // Here, we'll simulate verification by decoding the token (JWT) parts
    // This is NOT secure and is only for demonstration
    try {

      //  const ticket = await googleClient.verifyIdToken({
      //   idToken: credential,
      //   audience: process.env.GOOGLE_CLIENT_ID,
      // });

      // const payload = ticket.getPayload();
      // // Decode the token (in a real app, verify with Google API)
      // // const tokenParts = idToken.split('.');
      // // const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const { name, email, providerId, profilePicture } = userData;
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (user) {
        // Update social information
        user.socialProvider = 'google';
        user.socialId = providerId;
        if (profilePicture) {
          user.profilePicture = profilePicture;
        }
        await user.save();
      } else {
      const password = require('crypto').randomBytes(16).toString('hex');

        // Create new user
        user = await User.create({
          name,
          email,
          role: 'student',
          socialProvider: 'google',
          socialId: providerId,
          profilePicture: profilePicture || '',
          phone: '',
          gender: '',
          password
        });
      }
      
      // Generate JWT token
      const token = user.getSignedJwtToken();
      
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profilePicture: user.profilePicture,
          gender: user.gender
        }
      });
    } catch (error) {
      console.error('Token decode error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid token',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify Facebook token and login/register user
// @route   POST /api/auth/facebook-token
// @access  Public
exports.verifyFacebookToken = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No access token provided'
      });
    }
    
    // In a production app, you would verify the token with Facebook's API
    // and get user data from their Graph API
    // Here we'll simulate the verification process
    try {
      // Simulate calling Facebook Graph API to get user data
      // In a real app, this would be:
      // const fbResponse = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`);
      // const { id, name, email, picture } = fbResponse.data;
      
      // For demo, generate random data based on token
      const facebookId = `fb_${accessToken.substring(0, 10)}`;
      const name = `Facebook User ${accessToken.substring(0, 5)}`;
      const email = `${accessToken.substring(0, 5)}@facebook-user.com`;
      const picture = `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}`;
      
      // Check if user exists
      let user = await User.findOne({ email });
      
      if (user) {
        // Update social information
        user.socialProvider = 'facebook';
        user.socialId = facebookId;
        if (picture) {
          user.profilePicture = picture;
        }
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name,
          email,
          role: 'student',
          socialProvider: 'facebook',
          socialId: facebookId,
          profilePicture: picture || '',
          phone: '',
          gender: '',
          password
        });
      }
      
      // Generate JWT token
      const token = user.getSignedJwtToken();
      
      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profilePicture: user.profilePicture,
          gender: user.gender
        }
      });
    } catch (error) {
      console.error('Facebook API error:', error);
      return res.status(400).json({
        success: false,
        message: 'Invalid token or API error',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Facebook token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Handle Google OAuth callback - UPDATED for Passport.js
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = (req, res) => {
  try {
    
    // Passport adds the user to the request object
    if (req.user && req.user.token) {
      
      // Determine user role and redirect accordingly
      let dashboardPath = '/student/dashboard';
      if (req.user.role === 'admin') {
        dashboardPath = '/admin/dashboard';
      } else if (req.user.role === 'hostel_manager') {
        dashboardPath = '/manager/dashboard';
      }

      // Send HTML with script to post message to parent window and handle redirect
      res.send(`
        <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f0fff4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                color: #065f46;
                text-align: center;
              }

              .success-icon {
                width: 60px;
                height: 60px;
                margin-bottom: 20px;
              }

              .message {
                font-size: 18px;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p class="message">Authentication successful. Redirecting...</p>

            <script>
              console.log('Google OAuth callback script started');
              
              const authData = {
                type: 'SOCIAL_AUTH_SUCCESS',
                provider: 'google',
                token: '${req.user.token}',
                userData: {
                  id: '${req.user._id || req.user.id}',
                  name: '${req.user.name}',
                  email: '${req.user.email}',
                  role: '${req.user.role}',
                  providerId: '${req.user.socialId}',
                  profilePicture: '${req.user.profilePicture || ''}'
                }
              };
              
              try {
                // Check if this is a popup window
                if (window.opener && !window.opener.closed) {
                  console.log('Posting message to parent window');
                  window.opener.postMessage(authData, '*');
                  
                  // Close popup after posting message
                  setTimeout(() => {
                    window.close();
                  }, 1000);
                } else {
                  console.log('No parent window found, redirecting directly');
                  // Store auth data in localStorage for the main window
                  localStorage.setItem('token', authData.token);
                  localStorage.setItem('user', JSON.stringify(authData.userData));
                  
                  // Redirect to dashboard
                  window.location.href = '${process.env.WEB_URL || 'http://localhost:5173'}${dashboardPath}';
                }
              } catch (error) {
                console.error('Error in callback:', error);
                // Fallback: redirect to login with error
                window.location.href = '${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=callback_error';
              }
            </script>
          </body>
          </html>
      `);
    } else {
      
      // Failed authentication
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authentication Failed</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #fef2f2;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                color: #dc2626;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <h2>Authentication Failed</h2>
            <p>Unable to authenticate with Google. This window will close automatically.</p>
            <script>
              console.log('Authentication failed');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'SOCIAL_AUTH_FAILURE',
                    provider: 'google',
                    error: 'Authentication failed - no user data'
                  }, '*');
                }
                
                setTimeout(() => {
                  if (window.opener && !window.opener.closed) {
                    window.close();
                  } else {
                    window.location.href = '${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=auth_failed';
                  }
                }, 2000);
              } catch (error) {
                console.error('Error in failure callback:', error);
                window.location.href = '${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=callback_error';
              }
            </script>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error in googleCallback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            console.error('Server error in Google callback');
            window.location.href = '${process.env.WEB_URL || 'http://localhost:5173'}/student/login?error=server_error';
          </script>
        </body>
      </html>
    `);
  }
};

// @desc    Handle Facebook OAuth callback
// @route   GET /api/auth/facebook-callback
// @access  Public
exports.facebookCallback = async (req, res) => {
  // In a real implementation, we would verify the Facebook token here
  // and extract user information from it
  
  // For demo purposes, we'll send back a script that posts a message to the parent window
  res.send(`
    <html>
      <body>
        <script>
          // Simulate getting a token from Facebook OAuth
          const mockAccessToken = 'EAABZCqPZCM8pIBAO7izH4JvZBdgXWDtvw5jyIwsygAUmZA0nV9R7ZCoZCW4odan9jCxRd6BCH3AOnZCjs37L';
          
          window.opener.postMessage({
            type: 'SOCIAL_AUTH_SUCCESS',
            provider: 'facebook',
            token: mockAccessToken,
            userData: {
              // This would come from the Facebook OAuth response
              name: 'Facebook User',
              email: 'facebook.user@example.com',
              providerId: 'facebook_user_id_12345',
              profilePicture: 'https://ui-avatars.com/api/?name=Facebook+User'
            }
          }, '*');
          
          // Close the window after sending the message
          setTimeout(() => window.close(), 1000);
        </script>
        <p>Authentication successful. This window will close automatically.</p>
      </body>
    </html>
  `);
};
