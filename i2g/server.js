//variable def
var express = require('express'),
	bodyParser = require('body-parser'),
	multer  = require('multer'),
	fs = require('fs');


//variable def
var app = express();






app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));


//serve static html
app.use(express.static('./'));


//******** Server ********

//set up a server
var server = app.listen(9527, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Example app listening at http://%s:%s", host, port);
});