if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
  console.log('dotenv loaded');
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const User = require('./Models/user');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ExpressError = require('./utils/ExpressError.js');
const registerRoutes = require('./routes/register');
const { MongoClient, ServerApiVersion } = require('mongodb');
const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl)
  .then(() => {
    console.log('Mongo Connected');
  })
  .catch(err => {
    console.log("Oh no mongo error!!!")
    console.log(err)
  });

const secret = process.env.SECRET;
const client = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const store = MongoStore.create({
  client: client,
  dbName: 'waitlistApp',
  touchAfter: 24 * 60 * 60,  // Adjust as needed
  crypto: {
    secret: secret
  }
});


async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('Public'));



app.use(session({
  store:MongoStore.create({
    client,
    dbName: 'waitlistApp'
  }) ,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

app.get('/', (req, res) => {
  res.render('home');
});

app.use('/', registerRoutes);

app.all('*', (req, res, next) => {
  next(new ExpressError('Page Not Found', 404))
});

app.use((err, req, res, next) => {
  res.status(err.statusCode).render('error', { err });
});

app.use((err, req, res, next) => {
  if (err.statusCode !== 404) {
    err.statusCode = 500;
    err.message = 'Oh No, Something Went Wrong!';
  }
  res.status(err.statusCode).render('error', { err });
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(run, 5000); // Retry after 5 seconds
  }
}

run().catch(console.dir);
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});


