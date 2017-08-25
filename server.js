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
app.use("/semantic", express.static('./davi/semantic'));
app.use("/i2v", express.static(srcDir.i2v));
app.use("/p4",  express.static(srcDir.p4));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var provenance = [];
var provID = 0;

var users = {};
var largeDisplay = null;

var userIdDict = {};

io.on('connection', function (socket) {
    socket.on('add user', function (userInfo) {
        socket.user = userInfo;
        if(!userIdDict[userInfo.name]){
            users[userInfo.name] = socket.user;
            userIdDict[userInfo.name] = Object.keys(userIdDict).length + 1;
        }
        socket.emit('login', {
            numUsers: Object.keys(users).length
        });
        console.log(users);
    });

    socket.on('large display', function(displayInfo) {
        largeDisplay = socket;
        largeDisplay.emit('update', {
            logs: provenance,
         });
        console.log('Large Display connected');
    });

    socket.on('mergeRequest', () => {
        console.log("mergeRequest");
        let ret = [];
        let removeNodes = [];
        let removeLinks = [];
        for(var i = provenance.length - 1; i >= 0; i--){
            for(var j = provenance[i].increments.length - 1; j >= 0; j--){
                let curNode = provenance[i].increments[j];
                if(curNode.action === "Remove node"){
                    removeNodes.push(curNode.nodename);
                }else if(curNode.action === "Remove link"){
                    removeLinks.push(curNode.nodename);
                }else if(curNode.action === "Add node"){
                    let temp = removeNodes.indexOf(curNode.nodename);
                    if(temp > -1){
                        removeNodes.splice(temp, 1);
                    }else{
                        ret.push(curNode);
                    }
                }else if(curNode.action === "Add link"){
                    let temp = removeNodes.indexOf(curNode.nodename);
                    if(temp > -1){
                        removeLinks.splice(temp, 1);
                    }else{
                        ret.push(curNode);
                    }
                }else{
                    console.log("Undefined action: " + curNode.action);
                }
            }
        }
        console.log("Reply: ");
        console.log(ret);
        socket.emit('mergeReply', {
            master: ret,
        });
    });  //A nodes&links should be saved for collaboration view

    socket.on('push', function(data) {
        if(largeDisplay !== null) {
            let userId = userIdDict[socket.user.name];
            // var log = {
            //     pullNodename: data.pullNodename,
            //     userId: userId,
            //     commitReason: data.note,
            //     increments: data.increments,
            //     datetime: new Date(),
            //     waitMore: false,
            // };

            let curIdx = provenance.length;
            for(var i = 0; i < data.increments.length; i++){
                let pullNodename = data.pullNodename;
                if(i > 0){
                    pullNodename = data.increments[i - 1].nodename;
                }
                let tlog = {
                    pullNodename: pullNodename,
                    userId: userId,
                    commitReason: data.note,
                    increments: [data.increments[i]],
                    datetime: new Date(),
                    waitMore: (i === data.increments.length - 1) ? false : true,
                    serverId: provID,
                }
                provenance.push(tlog);
                provID++;
            }
            console.log(provenance);
            console.log("Update");
            largeDisplay.emit('update', {
                logs: provenance.slice(curIdx),
            });
        }
    });

//belongTo ancestor to purge not ancestor branches  
//Merge: provide last node needed

    socket.on('pullRequest', function(node){
        let todoList = node.fathers;
        let allAncestors = [];
        for(var i = 0; i < todoList.length; i++){
            allAncestors.push(todoList);
            if(todoList[i].fathers){
                todoList.concat(todoList[i].fathers);
            }
        }
        // console.log(allAncestors);

        // console.log("_____________");
        // console.log(node);
        // console.log(provenance);
        let ret = [];
        if(node.type === "Merge"){
            for(var i = 0; i < provenance.length; i++){
                ret.push(provenance[i]);
                if(provenance[i].increments[0] && provenance[i].increments[0].nodename === node.lastNode.nodename){
                    break;
                }
            }
        }else{
            let curSeeking = node.nodename;
            let maxIdx = 0;
            // console.log(curSeeking);
            for(var i = 0; i < provenance.length; i++){
                if(provenance[i].increments[0] && provenance[i].increments[0].nodename === curSeeking){
                    maxIdx = i;
                    break;
                }
            }
            // console.log(maxIdx);
            for(; maxIdx >= 0; maxIdx--){
                if(curSeeking.indexOf("Merge") > -1){
                    ret.push(provenance[maxIdx]);
                    continue;
                }
                if(provenance[maxIdx].increments[0].nodename === curSeeking){
                    ret.push(provenance[maxIdx]);
                    curSeeking = provenance[maxIdx].pullNodename.nodename? provenance[maxIdx].pullNodename.nodename : provenance[maxIdx].pullNodename;
                    console.log(curSeeking);
                }
            }
            ret.reverse();
            // console.log(provenance);
        }

        socket.emit('pullRespond', ret);
        // console.log(ret);
        // console.log("_____________");

    })

    // socket.broadcast.emit('bcast msg', {
    //     title: 'new user joined',
    //     username: socket.username,
    // });
});

require('./dataroutes.js').setupRoutes(app);

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
