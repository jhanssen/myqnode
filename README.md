MyQNode
=======

This is a NodeJS module that allows you to control your Chamberlain MyQ enabled 
Garage Door Opener. 

Follow Chamberlain's userguide to install the MyQ Gateway on your network, as well as
to create an account with the myQ portal.


## Installation

	npm install @jhanssen/myqnode --save


## Usage

	var myQ = require('@jhanssen/myqnode').myQ;

	myQ.getDevices('<userid>','<password>')
	   .then(function(respObj){
	        console.log(respObj); 
	   },
	   function(respObj){
	        console.log("Error executing method "+respObj);
           }
        );


	myQ.openDoor('<userid>','<password>','<deviceId>')
	   .then(function(state){
          	console.log("Sucessfully Opened Door,"+state);
	   },
           function(state){
           	console.log("Error Opening Door",+state);
	   }
        );



