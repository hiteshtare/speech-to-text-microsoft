//Node Modules
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');

var config = require('./config')

//Initialize express app
var app = express();

//Port number
var port = process.env.PORT || 5000

//Enable logging using morgan
app.use(morgan('dev'));

//Connect to Database
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true
}).then(() => {
  console.log(`Connected to ${config.mongoURI}`);
}).catch((e) => {
  throw e;
});
mongoose.Promise = global.Promise;

//Start express server on specified port
app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});