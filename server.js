var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app);

var port = process.env.PORT || 7000,
    host = process.env.HOST || "localhost";

console.log("initializing server ");

// Static files
app.use(express.static('ui'));
app.use("/data", express.static('data'));
app.use("/npm", express.static('node_modules'));

// ivastack libs
var srcDir = {
    vui: './node_modules/davi/src',
    i2v: './node_modules/i2v/src',
    p4: './node_modules/p4.js/src',
}


app.use("/vastui", express.static(srcDir.vui));
app.use("/semantic", express.static('./semantic'));
app.use("/i2v", express.static(srcDir.i2v));
app.use("/p4",  express.static(srcDir.p4));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

require('./dataroutes.js').setupRoutes(app);

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
