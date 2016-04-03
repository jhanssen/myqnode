/*************************************************************************************
/* NodeJS Module to control Chamberlain's MyQ Garage Door. The 
/* api methods all return Promises
/*
/* NOTE: To find your deviceId, run the getDevices() method and log
/*       the respObj. (See included example.js file to see how). In 
/*       the output that is logged, look for a device with attribute 
/*       MyQDeviceTypeName: 'GarageDoorOpener' or TypeId: 47. Use 
/*       the corresponding 'DeviceId' attribute as the deviceId.
/*
/* 04/02/2016 - Jan Erik Hanssen                - Update to ES6 and support
/*                                                MyQ light switches
/* 10/02/2014 - Tito Mathews 			- Initial Coding
/*
/*************************************************************************************/

/*global require,module*/

var https = require("https");
var http = require("http");

var myQ = (function() {
    var myQImpl = {
        doorstates: ["Undefined","Open","Closed","Undefined","Opening","Closing"], // 1= Open, 2=Closed, 4=Opening, 5=Closing
        lightstates: [false, true],

        appKey : "Vj8pQggXLhLy0WHahglCD4N1nAkkXQtGYpq2HrHD7H1nvmbT55KqtN6RSF4ILB%2fi",
        secToken : 'null',
        options : {},

        getConnection : function(username, password) {
            if (this.secToken === 'null') {
                return this.authenticate(username, password).then(
                    (respObj) => {
                        return this.getDeviceList();
                    });

            } else {
                return this.getDeviceList();
            }
        },

        getDeviceStatus : function(deviceId,name) {
            this.options = {
                path : `/Device/getDeviceAttribute?appId=${this.appKey}&securityToken=${this.secToken}&devId=${deviceId}&name=${name}`,
                method : 'GET'
            };

            var p = new Promise(this.invokeService.bind(this)).then((respObj) => {
                if (respObj.ReturnCode !== '0'){
                    throw new Error("getDeviceStatus returned"+respObj.ReturnCode);
                }
                return respObj;
            });

            return p;
        },

        setDeviceStatus : function(deviceId,attrName,newState) {
            this.options = {
                path : '/Device/setDeviceAttribute',
                method : 'PUT'
            };

            var body = { DeviceId: deviceId,
                         ApplicationId: this.appKey,
                         AttributeName: attrName,
                         AttributeValue: newState,
                         securityToken: this.secToken };

            this.options.body = body;

            var p = new Promise(this.invokeService.bind(this)).then((respObj) => {
                if (respObj.ReturnCode !== '0'){
                    throw new Error("setDeviceStatus returned"+respObj.ReturnCode);
                }
                return respObj;
            });

            return p;
        },

        authenticate : function(username, password) {
            this.options = {
                path : `/api/user/validatewithculture?appId=${this.appKey}&username=${username}&password=${password}&culture=en`,
                method : 'GET'
            };

            var p = new Promise(this.invokeService.bind(this)).then((respObj) => {
                //console.log(respObj);
                this.secToken = respObj.SecurityToken;
            });

            return p;
        },

        getDeviceList : function() {
            this.options = {
                path : `/api/userdevicedetails?appId=${this.appKey}&securityToken=${this.secToken}`,
                method : 'GET'
            };

            return new Promise(this.invokeService.bind(this)).then((respObj) => {
                //console.log(respObj);
                if (respObj.ReturnCode !== '0'){
                    throw new Error("getDeviceList returned"+respObj.ReturnCode);
                }
                return respObj;
            });
        },

        invokeService : function(resolve, reject) {
            this.options.port = 443;
            this.options.host = 'myqexternal.myqdevice.com';
            this.options.headers = {
                'Content-Type' : 'application/json'
            };

            var protocol = this.options.port == 443 ? https : http;

            var request = protocol.request(this.options, (response) => {
                var output = '';
                //console.log(this.options.host + ':' + response.statusCode);
                response.setEncoding('utf8');

                response.on('data', (chunk) => {
                    output += chunk;
                });

                response.on('end', () => {
                    var obj = JSON.parse(output);
                    resolve(obj);
                });
            });
            request.on('error', (err) => {
                console.log("Error" + err);
                reject(new Error(err));
            });

            if (this.options.method === 'PUT'){
                request.write(JSON.stringify(this.options.body));
            }

            request.end();
        }
    };

    return {
        //below are the various api methods..all methods return es6-promise objects.

        //Returns devices on your account
        getDevices : function(username,password) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.getDeviceList();
            });
        },

        //Returns the status of the Garage door opener with the the given deviceId
        getDoorStatus : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.getDeviceStatus(deviceId,'doorstate');
            }).then((respObj) => {
                return myQImpl.doorstates[respObj.AttributeValue];
            });
        },

        //Opens the garage door with the given deviceId
        openDoor : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.setDeviceStatus(deviceId,'desireddoorstate',1);
            }).then((respObj) => {
                //console.log(respObj);
                return respObj.ReturnCode;
            });
        },

        //Closes the garage door with the given device id.
        closeDoor : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.setDeviceStatus(deviceId,'desireddoorstate',0);
            }).then((respObj) => {
                return respObj.ReturnCode;
            });
        },

        getLightStatus : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.getDeviceStatus(deviceId,'lightstate');
            }).then((respObj) => {
                return myQImpl.lightstates[respObj.AttributeValue];
            });
        },

        enableLight : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.setDeviceStatus(deviceId,'desiredlightstate',1);
            }).then((respObj) => {
                return respObj.ReturnCode;
            });
        },

        disableLight : function(username, password, deviceId) {
            return myQImpl.getConnection(username, password).then((respObj) => {
                return myQImpl.setDeviceStatus(deviceId,'desiredlightstate',0);
            }).then((respObj) => {
                return respObj.ReturnCode;
            });
        },

        //Elapsed time since the current state of the given device id
        elapsedTime : function(){
            return Promise.reject(new Error("Not implemented"));
        }
    };
})();

module.exports = { myQ: myQ };
