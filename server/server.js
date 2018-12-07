const http = require('http');
const app = require('./app');

//Port number
console.log(`Before port`);
var port = process.env.PORT || 5000;

const server = http.createServer(app);
console.log(`After server`);
//Start express server on specified port
server.listen(port, () => {
  console.log(`Server is listening on port: ${port}`);
});