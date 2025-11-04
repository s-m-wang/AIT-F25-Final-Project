import './config.mjs';
import './db.mjs';
import mongoose from 'mongoose';
import sanitize from 'mongo-sanitize';
import express from 'express';
const app = express();

//create random avatar for new user
//THIS IS A WIP from dicebear API
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

const avatar = createAvatar(lorelei, {
  seed: 'John Doe',
  // ... other options
});

const svg = avatar.toString();

import url from 'url';
import path from 'path';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended: false}));

const server = app.listen(process.env.PORT ?? 3000);
const Set = mongoose.model('Set');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.get('/', function(req, res){
	res.redirect('/create');
});

//create page for sets:
app.get('/create', function(req, res){
	res.render('create');
});

//posting a new set:
app.post('/create', async (req, res) => {
  const set = new Set({
    name: sanitize(req.body.setName), 
    description: sanitize(req.body.setDesc),
  });
  try {
    await set.save();
    res.redirect(`/sets/${set.name}`); //redirect to set page:
  } catch(err) {
    res.render('create', {message: err.message});
  }
});

//specific set page:
app.get('/sets/:setName', async (req, res) => {
  const setName = req.params.setName;
  const set = await Set.findOne({ name: setName });
  
  if (!set) {
    return res.status(404).send('Set not found');
  }
  res.render('set-page', { set });
});

//set list:
app.get('/my-sets', async (req, res) => {
    const sets = await Set.find({});
	res.render('sets', {sets});
});