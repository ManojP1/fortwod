var port = Number(process.argv.slice(2)[0]);;
var express = require('express');
var app = express();
const Game = require('./serverModel.js');
const https = require('https');
const fs = require("fs"); 
const jwt =  require("jsonwebtoken");
const bcrypt = require("bcrypt");
// app.disable('etag');

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
const sqlite3 = require('sqlite3').verbose();

// https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
//const { resourceLimits } = require('worker_threads');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());

// http://www.sqlitetutorial.net/sqlite-nodejs/connect/
// https://github.com/mapbox/node-sqlite3/wiki/API
// will create the db if it does not exist
var db = new sqlite3.Database('db/database.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

// https://expressjs.com/en/starter/static-files.html
app.use(express.static('static-content')); 
//app.use('/lib', express.static('lib')); 

function isEmptyObject(obj){
	return Object.keys(obj).length === 0;
}


//logout route
app.post('/api/logout', function(req,res){
	var result = {"error": {}, "success": false};

	jwt.verify(req.cookies['token'], "potatoes", function (err, decoded){
		if (err){
			res.status(401);
			result["error"]["token"] = 'invalid token, please log in again';
			result.success=false;
			return res.json(result);
		}

		result.success = true;
		res.status(200);

		//remove jwt 
		res.cookie('token','', {httpOnly: true, secure: true});
		console.log("successful logout from " + decoded.username);
		return res.json(result);
	});
});


//refresh route (for persistent login)
app.post('/api/', function (req, res) {
	var result = { "error": {} , "success":false, "user":""};

	if (req.cookies['token']){
		jwt.verify(req.cookies['token'], "potatoes", function(err, decoded){
			if (err){
				res.status(401);
				result["error"]["login"] = "token expired, login again";
				//console.log('invalid token');
				result.success=false;
				return res.json(result);
			}
			
			result.success = true;
			res.status(200);
			result.user = decoded.username;
			//console.log('valid token');
			return res.json(result);
		});
	} else {
		//console.log('no cookie');
		res.status(401);
		res.json(result);
	}
});

//login route
app.post('/api/login', function (req, res) {

	var user = req.body.user;
	var password = req.body.password;
	var result = { "error": {} , "success":false};

	if(user==""){
		result["error"]["user"]="user not supplied";
	}
	if(password==""){
		result["error"]["password"]="password not supplied";
	}
	if(isEmptyObject(result["error"])){
		let sql = 'SELECT * FROM user WHERE user=?;';
		db.get(sql, [user], function (err, row){
  			if (err) {
				res.status(500); 
    			result["error"]["db"] = err.message;
  			} else if (row) {
				//console.log(row.password);
				
				bcrypt.compare(password, row.password, function(err, check) {
					if (err){
						res.status(401);
						result.success = false;
						result["error"]["login"] = "login failed";
						return res.json(result);
					} else if (check) {
						
						jwt.sign({username:user}, "potatoes", {expiresIn: 1000 }, function(err, token) {
							if (err) {
								res.status(500);
							} else{
								//console.log("true");
								res.status(200);	
								result.success = true;
								res.cookie('token',token, {httpOnly: true, secure: true});
								return res.json(result);
							}
						});
						
						
					} else {
						//console.log("false");
						res.status(401);
						result.success = false;
						result["error"]["login"] = "login failed";
						return res.json(result);
						
					}
					//console.log(JSON.stringify(result));
					

				});
				
				
			} else {
				res.status(401);
				result.success = false;
    			result["error"]["login"] = "login failed";
				res.json(result);
			}
			
		});
	} else {
		res.status(400);
		res.json(result);
	}
});


//validate user form input
function validateUser(data){
	result = {};
	var user = data.user;
	var password = data.password;
	var confirmpassword = data.confirmpassword;
	var skill = data.skill;
	var year= data.year;
	var month= data.month;
	var day= data.day;

	if(!user || user==""){
		result["reguser"]="user not supplied";
	}
	if(!password || password==""){
		result["regpassword"]="password not supplied";
	}
	if(!confirmpassword || password!=confirmpassword){
		result["regcpassword"]="passwords do not match ";
	}
	if(!skill || -1==["beginner","intermediate","advanced"].indexOf(skill)){
		result["regskill"]="invalid skill";
	}
	if(!year || !/^\d{4}$/.test(year)){
		result["regyear"]="invalid year";
	} else {
		year = parseInt(year);
		if(!(1900<=year && year<=2100))result["year"]="invalid year";
	}
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	if(!month || -1==months.indexOf(month)){
		result["regmonth"]="invalid month";
	}
	if(!day || !/^\d{1,2}$/.test(day)){
		result["regday"]="invalid day";
	} else {
		day = parseInt(day);
		if(!(1<=day && day<=31))result["regday"]="invalid day";
	}

	return result;
}

//validate user profile data for profile update
function validateUserProfile(data){
	result = {};

	var user = data.user;
	var password = data.password;
	var confirmpassword = data.confirmpassword;
	var skill = data.skill;
	var year= data.year;
	var month= data.month;
	var day= data.day;

	if(!user || user==""){
		result["profuser"]="user not supplied";
	}
	if(!password || password==""){
		result["profpassword"]="password not supplied";
	}
	if(!confirmpassword || password!=confirmpassword){
		result["profcpassword"]="passwords do not match ";
	}
	if(!skill || -1==["beginner","intermediate","advanced"].indexOf(skill)){
		result["profskill"]="invalid skill";
	}
	if(!year || !/^\d{4}$/.test(year)){
		result["profyear"]="invalid year";
	} else {
		year = parseInt(year);
		if(!(1900<=year && year<=2100))result["profyear"]="invalid year";
	}
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	if(!month || -1==months.indexOf(month)){
		result["profmonth"]="invalid month";
	}
	if(!day || !/^\d{1,2}$/.test(day)){
		result["profday"]="invalid day";
	} else {
		day = parseInt(day);
		if(!(1<=day && day<=31))result["profday"]="invalid day";
	}
	return result;
}

// registration route (create new user)
app.post('/api/user/:user', function (req, res) {
	var result = { error: validateUser(req.body) , success:false};
	if(isEmptyObject(result["error"])){
		let sql = 'INSERT INTO user '+
			'(user, password, skill, year, month, day, playmorning, playafternoon, playevening) ' +
			' VALUES(?,?,?,?,?,?,?,?,?);';
		let d = req.body;

		bcrypt.hash(d.password,10, function(err, hash) {
			if (err) {
				result["error"]["regdb"] = err; return res.status(500);
			} else {
		        let params = [d.user, hash, d.skill, d.year, d.month, d.day, d.playmorning, d.playafternoon, d.playevening];
                db.run(sql, params, function (err){
  				if (err) {
				    res.status(500); 
					if (err.message == "SQLITE_CONSTRAINT: UNIQUE constraint failed: user.user"){
						result["error"]["regdb"] = "user with that name already exists";
					}
  				} else {
					if(this.changes!=1){
    					result["error"]["regdb"] = "Not updated";
					res.status(404);
				} else {
					res.status(200);
					result.success = true;
				}
				}
				res.json(result);
				});

			}});
	} else {
		res.status(400);
		res.json(result);
	}
});


//delete route (delete current user)
app.delete('/api/user/:user/delete/', function (req, res) {
	var result = { "error": {} , "success":false};
	if(req.body.user==""){
		result["error"]["user"]="user not supplied";
	}
	if (isEmptyObject(result["error"])){
		let sql = 'DELETE FROM user WHERE user=?;';
		db.run(sql, req.body.user, function (err){
			if (err) {
				res.status(500);
				result["error"]["deldb"] = err.message;
			} else {
				if (this.changes!=1){
					result["error"]["deldb"] = "Not Deleted";
					res.status(404);
				} else{
					res.status(200);
					result.success = true;
				}			
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
	
});

//update profile route (update profile information)
app.put('/api/user/:user', function (req, res) {
	var result = { error: validateUserProfile(req.body) , success:false};
	if (req.cookies['token']){
		jwt.verify(req.cookies['token'], "potatoes", function(err, decoded){
			if (err){
				result["error"]["token"]="token error";
				result["error"]["login"]="token expired, please log in again";
				res.status(401);
				return res.json(result);
			} else {
				if(isEmptyObject(result["error"])){
					let sql = 'UPDATE user SET '+
						' password=?, skill=?, year=?, month=?, day=?, playmorning=?, playafternoon=?, playevening=? ' +
						' WHERE user=?;';
					let d = req.body;
					bcrypt.hash(d.password, 10, function(err, hash){
						let params = [hash, d.skill, d.year, d.month, d.day, d.playmorning, d.playafternoon, d.playevening, d.credentials.user];
						db.run(sql, params, function (err){
							if (err) {
								res.status(500); 
									result["error"]["profdb"] = err.message;
							} else {
								if(this.changes!=1){
										result["error"]["profdb"] = "Not updated";
									res.status(404);
								} else {
									res.status(200);
									result.success = true;
								}
							}	
							res.json(result);
						});
					});	
				} else {
					res.status(400);
					res.json(result);
				}
			} 
		});
	} else {
		//console.log('no token');
		res.json(result);
	}
	
	
});

//obtain profile information route (for loading info from db into profile page)
app.get('/api/user/:user', function (req, res) {
	
	var user = req.params.user;
	var password = req.query.password;

	var result = { error: {} , success:false};
	if(user==""){
		result["error"]["user"]="user not supplied";
	}
	//if(password==""){
	//	result["error"]["password"]="password not supplied";
	//}
	if(isEmptyObject(result["error"])){
		let sql = 'SELECT * FROM user WHERE user=?;';
		db.get(sql, [user], function (err, row){
  			if (err) {
				res.status(500); 
    				result["error"]["db"] = err.message;
  			} else if (row) {
				res.status(200);
				result.data = row;
				result.success = true;
			} else {
				res.status(401);
				result.success = false;
    				result["error"]["login"] = "login failed";
			}
			res.json(result);
		});
	} else {
		res.status(400);
		res.json(result);
	}
});

//SET WEBSOCKET IN setupGame() FUNCTION IN CONTROLLER TO RUN ON IP AND PORT SERVER IS RUNNING ON
const server = https.createServer({
	key: fs.readFileSync('server.key'),
	cert: fs.readFileSync('server.crt')
  }, app).listen(port, () => {
	console.log('https app listening on port '+port);
});
// db.close();


var WebSocketServer = require('ws').Server
   ,wss = new WebSocketServer({server: server});

wss.on('close', function() {	
    console.log('disconnected');
});

wss.broadcast = function(isUpdate){
	if (isUpdate){
		var updates = { 'update': Stage.getUpdatedActors()};
		if(updates.length < 1) return; //no updates so don't broadcast 
	}
	for(let ws of this.clients){ 
		if(isUpdate) 
			ws.send(JSON.stringify(updates)); 
		else if(ws.hash && Stage.getPlayer(ws.hash))
			ws.send(JSON.stringify(Stage.initAll(ws.hash)));
	}
}
var Stage = new Game.Stage(1000); //create the game stage to with the given world size

wss.on('connection', function(ws) {
	ws.hash = null; //for identifying the player
	ws.on('message', function(message) {
		var data = JSON.parse(message);
		if(data.hash){ //initialize the player and client's model and update game model
			ws.hash = data.hash;
			ws.send(JSON.stringify(Stage.initAll(data.hash)));
		}		
		if(ws.hash){ //once a player is initialized then receive updates
			Stage.updatePlayer(ws.hash, data);
			return;
		}
	});
});

//Perform the step in the game model
setInterval(function (){  if(Stage.actors.length) Stage.step()}, 20);

//Update clients for any changes
setInterval(function (){ if(Stage.actors.length) wss.broadcast(true);}, 20);

//Ensure all clients are properly initialized
setInterval(function (){ if(Stage.actors.length) wss.broadcast(false);}, 3010);