var cfenv = require("cfenv");
var config = require('config.json')('./public/config.json');
var kue = require('kue'),
 express = require('express');
var redis = require('redis');
var Vote = require('./vote');
var winston = require('winston');
var mongoose = require('mongoose');

var appEnv = cfenv.getAppEnv();
var services = appEnv.services;

/* configuring mongodb connection */
if (config.mongodb.uri) {
    var databaseString = config.mongodb.uri;
} else {
    var mongodb_services = services["compose-for-mongodb"];
    databaseString = mongodb_services[0].credentials.uri;
}

mongoose.connect(databaseString);

/*configuring redis server */
var redisConfig = {
    redis: {
        port: config.redis.port,
        host: config.redis.hostname
    }
};
if (!config.redis.uri) {
    var redis_services = services["compose-for-redis"];
    config.redis.uri = redis_services[0].credentials.uri;
}
var client = redis.createClient(config.redis.uri);

client.on("error", function(err) {
    winston.log('error', 'Sorry redis server turned off. Retrying to connect in worker');
});

client.on('end', function() {});

client.on('connect', function(err) {

    //create our job queue
    var jobs = kue.createQueue(redisConfig),
        Job = kue.Job;

    jobs.process('votequeue', 1, function(job, done) {
        var id = job.data.emailId;
        var voteData = ({
            vote: job.data.userVote
        });

        Vote.updateVote(id, voteData, {}, function(err, student) {

            if (student) {
                response = 1

            } else {
                response = 0
            }
            console.log(response);
        });

        done();
    });
});
