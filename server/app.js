//Node Modules
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

//Initialize express app
const app = express();

//Custom Config
var config = require('./config')

//Custom Modules
const noteRoute = require('./api/routes/noteRoute');
const trainingRoute = require('./api/routes/trainingRoute');

//Connect to Database
mongoose.connect(config.mongoURI_config, {
  useNewUrlParser: true
}).then(() => {
  console.log(`Connected to ${config.mongoURI_config}`);
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

//Host static files
app.use(express.static(path.join(__dirname, 'public')));

//For client route redirect to HTML Client
app.use("/client", express.static(__dirname + "/client"));

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

//For any other route redirect to Angular-Src Dist
app.get('*', function (req, res) {
  res.send(path.join(__dirname), 'public/index.html');
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