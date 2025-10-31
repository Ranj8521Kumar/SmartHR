const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/v1/auth/google/callback',
        scope: ['profile', 'email'],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          let isNewUser = false;
          // Check if user already exists
          let user = await User.findOne({ providerId: profile.id, provider: 'google' });

          if (!user) {
            // Check if user exists with same email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link OAuth account to existing user
              user.provider = 'google';
              user.providerId = profile.id;
              await user.save();
            } else {
              // Create new user
              isNewUser = true;
              user = await User.create({
                firstName: profile.name.givenName || profile.displayName.split(' ')[0],
                lastName: profile.name.familyName || profile.displayName.split(' ')[1] || '',
                email: profile.emails[0].value,
                provider: 'google',
                providerId: profile.id,
                role: 'employee', // Default role for OAuth users
                isEmailVerified: true,
                avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
              });
            }
          }

          // Attach isNewUser flag to user object for use in callback
          user.isNewUser = isNewUser;
          return done(null, user);
        } catch (err) {
          console.error('Google OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
  console.log('✓ Google OAuth strategy initialized');
} else {
  console.log('⚠ Google OAuth credentials not found - skipping Google OAuth');
}

// LinkedIn OAuth Strategy - Only initialize if credentials are provided
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/api/v1/auth/linkedin/callback',
        // Use LinkedIn's standard OAuth scopes to reliably fetch profile and email
        scope: ['r_liteprofile', 'r_emailaddress'],
        state: true,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          let isNewUser = false;
          // Check if user already exists
          let user = await User.findOne({ providerId: profile.id, provider: 'linkedin' });

          if (!user) {
            // Check if user exists with same email
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            
            if (!email) {
              return done(new Error('Email not provided by LinkedIn'), null);
            }

            user = await User.findOne({ email });

            if (user) {
              // Link OAuth account to existing user
              user.provider = 'linkedin';
              user.providerId = profile.id;
              await user.save();
            } else {
              // Create new user
              isNewUser = true;
              const firstName = profile.name.givenName || profile.displayName.split(' ')[0];
              const lastName = profile.name.familyName || profile.displayName.split(' ').slice(1).join(' ') || '';

              user = await User.create({
                firstName,
                lastName,
                email,
                provider: 'linkedin',
                providerId: profile.id,
                role: 'employee', // Default role for OAuth users
                isEmailVerified: true,
                avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
              });
            }
          }

          // Attach isNewUser flag to user object for use in callback
          user.isNewUser = isNewUser;
          return done(null, user);
        } catch (err) {
          console.error('LinkedIn OAuth error:', err);
          return done(err, null);
        }
      }
    )
  );
  console.log('✓ LinkedIn OAuth strategy initialized');
} else {
  console.log('⚠ LinkedIn OAuth credentials not found - skipping LinkedIn OAuth');
}

module.exports = passport;
