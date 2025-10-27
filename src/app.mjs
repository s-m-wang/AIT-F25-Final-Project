import express from 'express';

let server = null;
const app = express();
app.use(express.urlencoded({extended: false}));
server = app.listen(3000);