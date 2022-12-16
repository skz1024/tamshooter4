const fs = require('fs');
const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  fs.readFile('tamshooter4.html', 'utf-8', (err, data) => {
    res.statusCode = 200;
    // res.setHeader('Content-Type', '');
    // res.write(data)
    res.end(data)
  })
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});