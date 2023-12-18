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
const dbUrl = process.env.Db_Url;


// 'mongodb://127.0.0.1:27017/waitlisttest'
mongoose.connect(dbUrl)
  .then(() => {
    console.log('Mongo Connected');
  })
  .catch(err => {
    console.log("Oh no mongo error!!!")
    console.log(err)
  });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('Public')); 

const secret = process.env.SECRET;

app.use(session({
  store: MongoStore.create({ mongoUrl: dbUrl })
}));
// const store = MongoStore.create({
//     mongoUrl: dbUrl,
//     touchAfter: 24 * 60 * 60,
//     crypto: {
//         secret: secret
//     }
    
// });

store.on('error', function(e){
  console.log('Session Store Error',e)
})

const sessionConfig = {
  store:store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      // secure:true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

const client = new MongoClient(dbUrl, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.render('home');
});

app.use('/', registerRoutes);


app.all ('*',(req,res,next) => {
  next(new ExpressError('Page Not Found', 404))
})

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

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
