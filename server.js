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

let dataPath = process.env.COVA_DATASRC || 'selection.js';
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

var provenance = [];

var users = {},
    graphs = {},
    largeDisplay = null;

io.on('connection', function (socket) {
    socket.on('add user', function (userInfo) {
        socket.user = userInfo;
        users[userInfo.name] = socket.user;
        socket.emit('login', {
            numUsers: Object.keys(users).length
        });
        console.log(users);
    });

    socket.on('large display', function(displayInfo) {
        largeDisplay = socket;
        largeDisplay.emit('update', {
            users: users,
            graphs: graphs,
            logs: provenance
        });
        console.log('Large Display connected');
    });

    socket.on('push', function(data) {
        graphs[socket.user.name] = data.graph;
        if(largeDisplay !== null) {
            var graph = {links: [], nodes:[]};
            for(var name in users) {
                console.log(name, users);
                if(graphs.hasOwnProperty(name)) {
                    graphs[name].nodes.forEach(function(d){
                        d.id = d.label;
                        d._user = name;
                    });
                    graphs[name].links.forEach(function(d){
                        d._user = name;
                        d.source.id = d.source.label;
                        d.target.id = d.target.label;
                    });

                    graph.nodes = graph.nodes.concat(graphs[name].nodes);
                    graph.links = graph.links.concat(graphs[name].links);
                }
            }
            var log = {
                user: socket.user.name,
                note: data.note,
                graph: graph,
                datetime: new Date(),
            };
            provenance.push(log);
            console.log(graphs);
            largeDisplay.emit('update', {
                users: users,
                graphs: graphs,
                logs: [log]
            });
        }
    });

    // socket.broadcast.emit('bcast msg', {
    //     title: 'new user joined',
    //     username: socket.username,
    // });
});

//require('./dataroutes.js').setupRoutes(app);


server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
