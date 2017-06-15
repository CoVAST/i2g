var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

var port = process.env.PORT || 7000,
    host = process.env.HOST || "localhost";

console.log("initializing server ");

// Static files
app.use(express.static('ui'));
app.use("/data", express.static('data'));
app.use("/npm", express.static('node_modules'));

// ivastack libs
var srcDir = {
    davi: './davi/src',
    i2v: './node_modules/i2v/src',
    p4: './node_modules/p4.js/src',
}

let dataPath = 'selection.js';
app.get("/selection", (req, res) => {
    res.sendFile(__dirname + '/ui/' + dataPath);
})
app.get("/data/:dataSrc", (req, res) => {
    if (req.params.dataSrc === 'chinavis') {
        dataPath = 'selection-chinavis.js';
    } else {
        dataPath = 'selection.js';
    }
    res.redirect('/');
})

app.use("/vastui", express.static(srcDir.davi));
app.use("/semantic", express.static('./semantic'));
app.use("/i2v", express.static(srcDir.i2v));
app.use("/p4",  express.static(srcDir.p4));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var users = [],
    largeDisplay = null;

io.on('connection', function (socket) {
    socket.on('add user', function (userInfo) {
        socket.user = userInfo;
        console.log(userInfo);
        users.push(socket.user);

        socket.emit('login', {
            numUsers: users.length
        });
    });

    socket.on('large display', function(displayInfo) {
        largeDisplay = socket;
        console.log('Large Display connected');
    });

    socket.on('push', function(graph) {
        socket.user.graph = graph;
        if(largeDisplay !== null) {
            var graph = {links: [], nodes:[]};
            users.forEach(function(user){
                graph.nodes = graph.nodes.concat(user.graph.nodes);
                graph.links = graph.links.concat(user.graph.links);
            })
            largeDisplay.emit('update', graph)
        }
    });

    // socket.broadcast.emit('bcast msg', {
    //     title: 'new user joined',
    //     username: socket.username,
    // });
});

require('./dataroutes.js').setupRoutes(app);


server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
