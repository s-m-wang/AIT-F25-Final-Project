import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const User = mongoose.model('User');
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    // success
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user ID into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user by ID from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;