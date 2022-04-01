// See the JQuery documentation at ... 
// http://api.jquery.com/
// http://learn.jquery.com/
// See my JQuery and Ajax notes 
 
// ajax logout request
function api_logout(user, f, page){
	$.ajax({
		method:"POST",
		url:"/api/logout",
		contentType:"application/json; charset=utf-8",
		dataType: "json", 
		data: JSON.stringify({'user':user})
	}).done(function(data, text_status, jqXHR){
		f(data, true, page);
	}).fail(function(err) {
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Token Error" : err.status } };
		f(response, false, page);
	});
}

// ajax refresh
function api_refresh(user, f, page){
	$.ajax({
		method:"POST",
		url:"/api/",
		contentType:"application/json; charset=utf-8",
		dataType: "json", 
		data: JSON.stringify({ })
	}).done(function(data, text_status, jqXHR){
		f(data, true, page);
	}).fail(function(err) {
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Token Error" : err.status } };
		f(response, false, page);
	});
}   

// ajax login request
function api_login(user, password, f, page){
	$.ajax({ 
		method: "POST", 
		url: "/api/login", 
		contentType:"application/json; charset=utf-8",
		dataType: "json", 
		data: JSON.stringify({ "user": user , "password": password })
	}).done(function(data, text_status, jqXHR){
		f(data, true, page);
		/** console.log(JSON.stringify(data)); console.log(text_status); console.log(jqXHR.status); **/
	}).fail(function(err){
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Server Error" : err.status } };
		f(response, false, page);
		/** console.log(err.status); console.log(JSON.stringify(err.responseJSON)); **/
	});
}

//ajax delete request
function api_delete(data, f, page){
	$.ajax({
		method: "DELETE",
		url: "/api/user/"+data.user+"/delete",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify(data)
	}).done(function(data,text_status,jqXHR){
		//console.log(text_status); 
		//console.log(jqXHR.status);
		f(data, true, page);
	}).fail(function(err){
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Server Error" : err.status } };
		f(response, false, page);
	});
}

// ajax register request
function api_register(data, f, page){
	if(data.user==""){
		console.log("blank");
		f({"error":{ "reguser": "name is required"}}, false, page);
		return;
	}
	$.ajax({ 
		method: "POST", 
		url: "/api/user/"+data.user, 
		contentType:"application/json; charset=utf-8",
		dataType: "json", 
		data: JSON.stringify(data)
	}).done(function(data, text_status, jqXHR){
		console.log(text_status); 
		console.log(jqXHR.status); 
		f(data, true, page);
		/** console.log(JSON.stringify(data)); console.log(text_status); console.log(jqXHR.status); **/
	}).fail(function(err){
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Server Error" : err.status } };
		if("db" in response.error && response.error.db=="SQLITE_CONSTRAINT: UNIQUE constraint failed: user.user"){
			response.error.db="user already taken";
		}
		f(response, false, page);
		/** console.log(err.status); console.log(JSON.stringify(err.responseJSON)); **/
	});
}

// ajax request to update profile
function api_profile(data, f, credentials, page){
	data.credentials = credentials;
	data.user = credentials.user;
	$.ajax({ 
		method: "PUT", 
		url: "/api/user/"+data.user, 
		contentType:"application/json; charset=utf-8",
		dataType: "json", 
		data: JSON.stringify(data)
	}).done(function(data, text_status, jqXHR){
		console.log(text_status); 
		console.log(jqXHR.status); 
		f(data, true, page);
		/** console.log(JSON.stringify(data)); console.log(text_status); console.log(jqXHR.status); **/
	}).fail(function(err){
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Server Error" : err.status } };
		f(response, false, page);
		/** console.log(err.status); console.log(JSON.stringify(err.responseJSON)); **/
	});
}

// ajax request to load data into profile form
function api_profile_load(f, credentials, page){
	var data = { "credentials" : credentials };
	$.ajax({ 
		method: "GET", 
		url: "/api/user/"+credentials.user, 
		dataType: "json", 
		data: { "password" : credentials.password } // send URL encoded credentials
	}).done(function(data, text_status, jqXHR){
		console.log(text_status); 
		console.log(jqXHR.status); 
		f(data, true, page);
		/** console.log(JSON.stringify(data)); console.log(text_status); console.log(jqXHR.status); **/
	}).fail(function(err){
		let response = {};
		if("responseJSON" in err)response = err.responseJSON;
		else response = { error: { "Server Error" : err.status } };
		f(response, false, page);
		/** console.log(err.status); console.log(JSON.stringify(err.responseJSON)); **/
	});
}