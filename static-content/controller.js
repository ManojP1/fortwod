//const { response } = require("express");

var stage=null;
var view = null;
var interval=null;
var canvas=null;
server = new Object();


function preventDefault(e) {
    e.preventDefault();
}
function disableScroll() {
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
}
function enableScroll() {
    document.body.removeEventListener('touchmove', preventDefault);
}
var touchDown = {'x': -1, 'y': -1};
var touchUp = {'x':-1, 'y':-1};
var twoFinger = false;

//Get Mouse Position
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

//Get keyboard input and direction 
function keyInput(event) {
	var key = event.key;
		var moveMap = { 
			'a': { "dx": -1, "dy": 0},
			's': { "dx": 0, "dy": 1},
			'd': { "dx": 1, "dy": 0},
			'w': { "dx": 0, "dy": -1}
		};
		if (key in moveMap) {
			server.send({ 'moveMap': moveMap[key]});
		} else if (key == "e") {
			server.send({ 'pickup': true });
		}
}

//send mouse position information to server
function getMouse(event){
	var mousePos = getMousePos(canvas, event);
	server.send({ 'mousePos': mousePos });
}

//send mouse click inputs to server
function clickMouse(event){
	var mousePos = getMousePos(canvas, event);
	server.send({ 'mouseClick': mousePos });
}

//grants permissions for mobile features such as accelerometer
function grantPermissions() {
	if (DeviceMotionEvent){
		window.addEventListener('devicemotion', (event) => {
			var nax=event.accelerationIncludingGravity.x/9.8;
			var nay=event.accelerationIncludingGravity.y/9.8;
			var naz=event.accelerationIncludingGravity.z/9.8;
			
			var h=event.interval;
			var d= [(nax)/h, (nay)/h, (naz)/h];
			var magnitude=Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
			
			ax=nax;  ay=nay;  az=naz;
			
			if(magnitude>0.1){
				server.send({ 'pickup': true });
				//alert("bump");
			}
		});
		// accelerometer
		window.DeviceMotionEvent.requestPermission().then(response => {
			if (response == 'granted') {
				window.addEventListener('devicemotion', (event) => {
					var nax=event.accelerationIncludingGravity.x/9.8;
					var nay=event.accelerationIncludingGravity.y/9.8;
					var naz=event.accelerationIncludingGravity.z/9.8;
					
					var h=event.interval;
					var d= [(nax)/h, (nay)/h, (naz)/h];
					var magnitude=Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
					
					
					if(magnitude>0.1){
						server.send({ 'pickup': true });
						//alert("bump");
					}
				});
			}
		}).catch(console.error);
	}
}

function touchStart(event){
	if (event.touches.length > 1){ //detects two finger tap
		twoFinger = true;
	}
	touchDown.x=event.touches[0].clientX; //intial touch position saved
	touchDown.y=event.touches[0].clientY;
	return false;
}

function touchMove(event){ //swipe to move
	touchUp.x=event.touches[0].clientX;
	touchUp.y=event.touches[0].clientY;
	var diffX = touchDown.x - touchUp.x; //difference between current touch position and inital touch positon
	var diffY = touchDown.y - touchUp.y;
	server.send({ 'moveMap': { "dx": -diffX * 5, "dy": -diffY * 5}  });
	return false;
}

function touchEnd(event){
	if (twoFinger){ //picks up ammo
		server.send({ 'pickup': true });
		twoFinger = false;
	}
	return false;
}

server.send=function(data){};
server.update = function() {return false;}; 


//connects player to game, connects to websocket
function setupGame(hash){
	canvas=document.getElementById('stage');
	
	//SET THE IP AND PORT TO THE NUMBERS THE SERVER IS RUNNING ON
	socket = new WebSocket("wss://10.0.0.213:10345/websocket");
	socket.onopen = function (event) {
		console.log("connected");
		server.send= function(data){
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(data));
            }
        }
        server.send({'hash':hash, 'canvasWidth': canvas.width, 'canvasHeight':canvas.height});
	};
	socket.onmessage = function (event) {
		var data = JSON.parse(event.data);
		if ('init' in data){
			stage = new Stage(canvas, data.size, hash);
			stage.init(data.init);
			canvas.addEventListener("mousemove", getMouse , false);
			canvas.addEventListener("click", clickMouse, false);
			document.addEventListener('keydown', keyInput, false);
			document.addEventListener('touchstart', touchStart, false);
			document.addEventListener('touchend', touchEnd, false);
			document.addEventListener('touchmove', touchMove, false);
		} else if ('update' in data){
			server.update = function() {
				if(stage){
					stage.update(data.update); 
					if(stage.player) 
						return true;
					pauseGame();
				}
				return false;
                };
		} 
	}
	server.close = function (){socket.close()};
}

function startGame(){
	interval=setInterval(function () { if(server.update()) stage.draw(); },20);
}

function pauseGame(){
	clearInterval(interval);
	interval=null;
	
	document.removeEventListener('keydown', keyInput);

	//report the mouse position on click
	canvas.removeEventListener("mousemove", getMouse , false);
	canvas.removeEventListener("click", clickMouse, false);
	document.removeEventListener('touchstart', touchStart);
	document.removeEventListener('touchend', touchEnd);
	document.removeEventListener('touchmove', touchMove);

}



//handler functions that make AJAX calls to change page content
function gui_login(page){
	var user = $("#ui_login [name=user]").val();
	var password = $("#ui_login [name=password]").val();
	var f = function(data, success, page){ //callback
		var s = success && data.success;
		if(s){
			
			var info = data;
			localStorage.setItem("loggedIn", true);
			page.setState((prevState, props) => { //callback changes state of main component
				return { page: 'play', curuser: user, curpassword: password, user: '', password: '', login: '', db: '' } ;
			});
		} else {
			var errors = data.error;
			page.setState((prevState, props) => {
				return {'login': ''};
			});
			page.setState((prevState, props) => {
				var newState = {};
				for (var error in errors){				
					newState[error]=errors[error];
				}
				if (!('user' in newState)){
					newState['user']='';
				}
				if (!('password' in newState)){
					newState['password']='';
				}
				if (!('login' in newState)) {
					newState['login']='';
				}
				if (!('db' in newState)){
					newState['db']='';
				}
				return newState;
			});
		}
	}
	api_login(user, password, f, page);
	
}

//checks if checkbox has been selected
function checkboxSelected(value){
	if(value)return true;
	return false;
}

function getProfileFromForm(formId){
	//gets profile info from current form in profile page
	var data = {
		user : $(formId+" [name=user]").val(),
		password : $(formId+" [name=password]").val(),
		confirmpassword : $(formId+" [name=confirmpassword]").val(),
		skill : $(formId+" [name=skill]:checked").val(),
		year: $(formId+" [name=year]").val(),
		month: $(formId+" [name=month]").val(),
		day: $(formId+" [name=day]").val(),
		playmorning: checkboxSelected($(formId+" [name=playmorning]:checked").val()),
		playafternoon: checkboxSelected($(formId+" [name=playafternoon]:checked").val()),
		playevening: checkboxSelected($(formId+" [name=playevening]:checked").val())
	};
	
	return data;
}

//delete button click handler, deletes current users account
function gui_delete(page, user){
	var data = {"user": user};
	var f = function(data, success, page){
		var s = success && data.success;
		if(s){
			var info = data;
			page.setState((prevState, props) => {
				localStorage.setItem("loggedIn", false);
				return {page: 'login', curuser: '', curpassword: ''} ;
			});
		} else {
			var errors = data.error;
			page.setState((prevState, props) => {
				var newState = {};
				for (var error in errors){
					newState[error]=errors[error];
				}
				return newState;
			});
		}
	}
	api_delete(data, f, page);
}

//register button click handler
function gui_register(page){
	var data = getProfileFromForm("#ui_register");
	var f = function(response, success, page){
		if(success){
			page.setState((prevState, props) => {
				return { page: 'login',  reguser: '', regpassword: '', //sets page to login, resets all errors
				 regcpassword: '', regskill: '', regyear: '', regmonth: '', regday: '', regdb: '' };
			});	
		} else {
			var errors = response.error;
			page.setState((prevState, props) => {
				return {'regdb': ''};
			});
			page.setState((prevState, props) => {
				var newState = {};
				for (var error in errors){
					newState[error]=errors[error];
				}
				if (!('reguser' in newState)){
					newState['reguser']='';
				}
				if (!('regpassword' in newState)){
					newState['regpassword']='';
				}
				if (!('regcpassword' in newState)) {
					newState['regcpassword']='';
				}
				if (!('regskill' in newState)) {
					newState['regskill']='';
				}
				if (!('regyear' in newState)) {
					newState['regyear']='';
				}
				if (!('regmonth' in newState)) {
					newState['regmonth']='';
				}
				if (!('regday' in newState)) {
					newState['regday']='';
				}
				if (!('regdb' in newState)){
					newState['regdb']='';
				}
				return newState;
			});
		}
	}
	api_register(data, f,page);
}

//Update profile click handler 
function gui_profile(page, user, password){
	var data = getProfileFromForm("#ui_profile");
	var f = function(response, success, page){
		if(success){
			page.setState((prevState,props) => {
				return { curpassword: data.password, profuser: '', profpassword: '',
				 profcpassword: '', profskill: '', profyear: '', profmonth: '', profday: '', profdb: '', success: 'profile successfully updated' };
			});
		} else {
			var errors = response.error;
			
			if (errors["token"]){
				localStorage.setItem("loggedIn", false);
				page.setState((prevState, props) => {
					return {'page': 'login'};
				})
				page.setState((prevState, props) => {
					var newState = {};
					newState["login"]=errors["login"];
					return newState
				});
				
			} else {

				page.setState((prevState, props) => {
					return {'profdb': ''};
				});
				page.setState((prevState, props) => {
					var newState = {};
					
					for (var error in errors){
						
						newState[error]=errors[error];
					}
					if (!('profuser' in newState)){
						newState['profuser']='';
					}
					if (!('profpassword' in newState)){
						newState['profpassword']='';
					}
					if (!('profcpassword' in newState)) {
						newState['profcpassword']='';
					}
					if (!('profskill' in newState)) {
						newState['profskill']='';
					}
					if (!('profyear' in newState)) {
						newState['profyear']='';
					}
					if (!('profmonth' in newState)) {
						newState['profmonth']='';
					}
					if (!('profday' in newState)) {
						newState['profday']='';
					}
					if (!('profdb' in newState)){
						newState['profdb']='';
					}
					return newState;
				});
			}
		}
	}
	var credentials = { user: user, password: password };
	api_profile(data, f, credentials, page);
}

function putDataIntoProfileForm(data){
	var formId="#ui_profile";
	//sets values of profile form from database values
	$(formId+" [name=user]").attr('placeholder', data.user);
	$(formId+" [name=skill][value="+data.skill+"]").attr('checked',true);
	$(formId+" [name=year]").val(data.year);
	$(formId+" [name=month]").val(data.month);
	$(formId+" [name=day]").val(data.day);
}

//loads profile populated with user info 
function gui_profile_load(page, user, pass){
	var credentials = { user: user, password: pass };
	var f = function(response, success, page){
		if(success){
			page.setState((prevState, props) => {
				return { page: 'profile', profiledata: response.data };
			  });
			// response.data has fields to load into our form
		} 
	}
	var credentials = { user: page.state.curuser, password: page.state.curpassword };
	api_profile_load(f, credentials, page);
}


//check token on page refresh to keep login status 
function gui_refresh(page, user){
	var f = function(response, success, page){
		if(success){
			localStorage.setItem("loggedIn", true);
			page.setState((prevState, props) => {
				return {page: 'play', curuser:response.user};
			});
		} else {
			localStorage.setItem("loggedIn", false);
			var errors = response.error;
			
			page.setState((prevState, props) => {
				var newState = {};
				for (var error in errors){				
					newState[error]=errors[error];
				}
				return newState;
			});
		}
	};
	api_refresh(user,f,  page);
	
}

//logout button click handler
function gui_logout(page, user){
	var f = function(response, success, page){
		if(success){
			page.setState((prevState, props) => {
				localStorage.setItem("loggedIn", false);
				return {page: 'login', curuser: user};
			});
		} else {
			page.setState((prevState, props) => {
				localStorage.setItem("loggedIn", false);
				return {page: 'login', curuser: user};
			});
			var errors = response.error;
			
			page.setState((prevState, props) => {
				var newState = {};
							
				newState["login"]=errors["token"];
				
				return newState;
			});
		}
	};
	api_logout(user, f, page);
}