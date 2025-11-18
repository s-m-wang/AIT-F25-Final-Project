import dotenv from 'dotenv';
dotenv.config();


import './config.mjs';
import './db.mjs';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize';
import express from 'express';
import session from 'express-session';
import passport from './auth.mjs';
import bcrypt from 'bcrypt';   
import { createClient } from 'pexels';

const pexelsClient = createClient(process.env.PEXELS_API_KEY);
console.log("PEXELS KEY:", process.env.PEXELS_API_KEY);
const app = express();

import url from 'url';
import path from 'path';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended: false}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

const server = app.listen(process.env.PORT ?? 3000);
const Set = mongoose.model('Set');
const Card = mongoose.model('Card');
const User = mongoose.model('User');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

//by default it sets user to login page:
app.get('/', function(req, res){
	res.redirect('/login');
});

//create page for sets:
app.get('/create', ensureLoggedIn, function(req, res){
	res.render('create');
});

//posting a new set:
app.post('/create', ensureLoggedIn, async (req, res) => {
  try {
    const set = new Set({
      name: sanitize(req.body.setName), 
      description: sanitize(req.body.setDesc),
      user: req.user._id
    });
    const existing = await Set.findOne({
      name: set.name,
      user: req.user._id
    });
    if (req.body.setName === "") {
      throw new Error('Invalid Name');
    }
    if (existing) {
      throw new Error('You already have a set with that name!');
    }
    await set.save();
    res.redirect(`/sets/${set.name}`); //redirect to set page:
  } catch(err) {
    res.render('create', {message: err.message});
  }
});

//specific set page:
app.get('/sets/:setName', ensureLoggedIn, async (req, res) => {
  const setName = req.params.setName;
  const set = await Set.findOne({ name: setName, user: req.user._id });
  const cards = await Card.find({ set: set });

  //make sure the cards are alphabetical using sort
  const sortedCards = cards
  .sort((a, b) => a.name.localeCompare(b.name))
  .map(card => ({
    name: card.name,
    description: card.description,
    url: card.url
  }));
  
  if (!set) {
    return res.status(404).send('Set not found');
  }


  res.render('set-page', { set: set, cards: sortedCards });
});

//set list:
app.get('/my-sets', ensureLoggedIn, async (req, res) => {
  const sets = await Set.find({user: req.user._id});
	res.render('sets', {sets});
});

app.post('/my-sets', ensureLoggedIn, async (req, res) => {
  const ids = req.body.checked;

  if (!ids) {
    return res.redirect('/my-sets'); // nothing checked
  }
  await Card.deleteMany({
    set: { $in: ids}
  });

  await Set.deleteMany({
    _id: { $in: ids},
    user: req.user._id
  });

  res.redirect('/my-sets');
});

//adding a new card:
app.post('/sets/:setName', ensureLoggedIn, async (req, res) => {
  const setName = req.params.setName;
  const set = await Set.findOne({ name: setName, user: req.user._id });
  if (!set) {
    return res.status(404).send('Set not found');
  }
  //random picture for cards:
  let url;
  try {
    const result = await pexelsClient.photos.search({
      query: req.body.cardDesc, 
      per_page: 1
    });

    if (result && Array.isArray(result.photos) && result.photos.length > 0) {
      url = result.photos[0].src.medium;
    } else {
      url = ''; 
    }
  } catch (e) {
    console.error('Pexels error:', e);
    url = '';
  }

  //create new card:
  const card = new Card({
    name: sanitize(req.body.cardName), 
    description: sanitize(req.body.cardDesc),
    url: url,
    set: set
  });

  const cards = await Card.find({ set: set });

  try {
    await card.save();
    res.redirect(`/sets/${set.name}`); //redirect to set page:
  } catch(err) {
    res.render(`/sets/${set.name}`, {message: err.message});
  }
});

//login
app.get('/login', (req, res) => {
  const messages = req.session.messages || [];
  const message = messages.length > 0 ? messages[0] : null;
  req.session.messages = [];
  res.render('login', { message });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/my-sets',
    failureRedirect: '/login?error=1',
    failureMessage: true
  })
);

//registration:
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const username = sanitize(req.body.user);
    const password = req.body.pass;

    //random pfp:
    const style = 'lorelei'; 
    const randomSeed = Math.random().toString(36).substring(2, 15);
    //API URL
    let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${randomSeed}`;

    if (!username || !password) {
      return res.render('register', { message: 'Username and password required.' });
    }

    if (await User.findOne({ username })) {
      return res.render('register', { message: 'Username already taken.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, passwordHash, url });
    await user.save();

    req.login(user, (err) => {
      if (err) {
        return res.render('register', { message: 'Registered, but login failed.' });
      }
      return res.redirect('/my-sets');
    });

  } catch (err) {
    res.render('register', { message: err.message });
  }
});

app.post('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});