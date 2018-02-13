var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

var port = process.env.PORT || 8080,
    host = process.env.HOST || "localhost";

// require('amdefine/intercept');


// Static files

app.use("/data", express.static('data'));
app.use("/npm", express.static('node_modules'));
app.use("/i2g", express.static('i2g'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
