const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // Add this line
const config = require('./config/database');

mongoose.Promise = global.Promise;
const app = express();

const port = process.env.PORT || 9000;

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Configure session
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: config.database }), // Use connect-mongo for session store
  cookie: { secure: process.env.NODE_ENV === 'production' } // Secure cookies in production
}));

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

var users = require('./routes/users');
var members = require('./routes/members');
var questionarie = require('./routes/template');
var package = require('./routes/package');
var userPacakge = require('./routes/user-package');
var membersaveanswer = require('./routes/membersaveanswer');
var feedback = require('./routes/feedback');
var sections = require('./routes/sections');
var category = require('./routes/category');
var subcategory = require('./routes/sub-categories');
var products = require('./routes/product');
app.use(express.json({
  limit: '50mb'
}));
app.use('/users', users);
app.use('/members', members);
app.use('/template', questionarie);
app.use('/package', package);
app.use('/users', userPacakge);
app.use('/memberssave', membersaveanswer);
app.use('/feedback', feedback);
app.use('/section', sections);
app.use('/category', category);
app.use('/subcategory', subcategory);
app.use('/product', products);

app.get('/', (req, res) => {
  res.send('hello world');
});

app.listen(port, () => {
  console.log('server running on ' + port);
});
