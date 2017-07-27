var request = require('request');
var express=require("express");
var app=express(); 

  var self = this;
 
  request.post({
    url: 'https://api.twitter.com/oauth/request_token',
    oauth: {
      consumer_key: app.set('mbN9sXyf9cTj5kXlf2PorAgUO'),
      consumer_secret: app.set('A4qGMkmHQWjWjtsjF8BhmjQnxCa4pGBOMAmR2WMxSt4FtLF8OL')
    },
    form: { x_auth_mode: 'reverse_auth' }
  }, function (err, r, body) {
    if (err) {
	console.log(500, { message: e.message });
    }
 
    if (body.indexOf('OAuth') !== 0) {
	 console.log(500, { message: 'Malformed response from Twitter' });
    }
 
    console.log({ x_reverse_auth_parameters: body });
  });
