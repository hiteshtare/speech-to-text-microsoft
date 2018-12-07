const http = require('http');
const app = require('./app');

//Port number
var port = process.env.PORT || 5000;

const server = http.createServer(app);

//Start express server on specified port
server.listen(process.env.PORT || port, () => {
  console.log(`Server is listening on port: ${port}`);
});