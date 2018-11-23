//Node Modules
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();

var config = require('./config')
const noteRoute = require('./api/routes/noteRoute');
const trainingRoute = require('./api/routes/trainingRoute');

//Connect to Database
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true
}).then(() => {
  console.log(`Connected to ${config.mongoURI}`);
}).catch((e) => {
  throw e;
});
mongoose.Promise = global.Promise;

//Middlewares
app.use(morgan('dev')); // Logging
app.use(bodyParser.urlencoded({ // Body Parser
  extended: false
}));
app.use(bodyParser.json());

//Cross Origin Resource Scripting
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
// Routes which should handle requests
app.use("/notes", noteRoute);
// Routes which should handle requests
app.use("/training", trainingRoute);

app.get('*', (req, res) => {
  res.send('Hello');
});

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;