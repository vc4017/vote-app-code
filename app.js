var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser')
var cfenv=require("cfenv")
var Vote = require('./vote');
var mongoose = require('mongoose');
var process = require('child_process');
var kue = require('kue')
var redis = require('redis');
var winston = require('winston');
var mongo = require('mongoskin');
var config = require('config.json')('./public/config.json');
var jobs = ""; // variable for maintaining vote queue
var Job = ""; // variable for handlign queue

var appEnv = cfenv.getAppEnv();

var services = appEnv.services;

if(config.mongodb.uri)
{
	var databaseString=config.mongodb.uri;
}
else
{
		var mongodb_services=services["compose-for-mongodb"];
		databaseString=mongodb_services[0].credentials.uri;

}
var db = mongo.db(databaseString);

var dbCollectionName=config.mongodb.collectionName;

winston.add(winston.transports.File, {
    filename: 'somefile.log'
});

/* connecting to mongodb database */
mongoose.connect(databaseString, function(err) {
      if (err)
      winston.log('error', 'Sorry mongodb is not connected');
      if(!err)
      winston.log("info","succesfully mongodb is connected")
  });

io.on('connection', function(socket) {

    winston.log('info', 'Socket connection established');
});

/* redis connection configuration */
var redisConfig = {
    redis: {
        port: config.redis.port,
        host: config.redis.hostname
    }
 };

 if(!config.redis.uri)
 {
	 var redis_services=services["compose-for-redis"];
	 config.redis.uri=redis_services[0].credentials.uri;
 }

var client = redis.createClient(config.redis.uri);

client.on("error", function(err) {
    winston.log('error', 'Sorry redis server turned off. Retrying to connect');
});

client.on('end', function() {

    winston.log('info', 'Redis kue disconnected');
});

client.on('connect', function(err) {
    winston.log('info', 'Redis kue connected');
    jobs = kue.createQueue({
      redis:config.redis.uri
    });
    Job = kue.Job;

});

/* configuring express application */
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

/* route to post conference details */
app.get('/conferenceName', function(req, res) {
    res.send(config.conferenceName);
});

app.get('/vote', function(req, res) {
    res.sendFile(__dirname + '/vote.html');
});

app.get('/results', function(req, res) {
    res.sendFile(__dirname + '/results.html');
});

//Retrieving the vote data from db
app.get('/api/retrieve', function(req, res) {

  Vote.getDetails(function(err, votesInfo) {
        if (votesInfo) {
           response = {
                "result": votesInfo
            }

            response=(JSON.stringify(response))

						var votes=[];
						for(i=0;i<config.votes.length;i++){
						votes.push(config.votes[i].vote);
						}
            var results=[];
            var n=4;

						/* resetting results data */
            for(i=0;i<n;i++)
            {
              results[i]=0;
            }

            var json=votesInfo;

						/* counting votes */
            for(j=0;j<json.length;j++)
             {
               i=votes.indexOf(json[j].vote);

               if(i>-1)
               results[i]+=1;
             }

						 /* caluclating vote percentage */
             total=eval(results[0])+eval(results[1])+eval(results[2])+eval(results[3]);

             var votesData=[];
             var tempJson={};

             value=(100/total)*eval(results[0]);
             tempJson={"result":value.toFixed(1)};
              votesData.push(tempJson);

             value=(100/total)*eval(results[1]);
             tempJson={"result":value.toFixed(1)};
              votesData.push(tempJson);

             value=(100/total)*eval(results[2]);
             tempJson={"result":value.toFixed(1)};
              votesData.push(tempJson);

             value=(100/total)*eval(results[3]);
             tempJson={"result":value.toFixed(1)};
              votesData.push(tempJson);

             var json={"result":votesData};

             io.emit('result', json);


        } else {
           response= {
                "error": "Sorry retrieve failed"
            }

        }
          res.send(response)
    });
});




//Retrieving the vote data based on ID from MongoDB Collection
app.get('/api/retrieveById', function(req, res) {
    var id = req.query.voterEmail;

    Vote.getVoterById(id, function(err, voterData) {
        if (voterData) {
            response = {
                "result": voterData
            }


        } else {
            response = {
                "error": "Sorry Try again"
            }


        }
        res.json(JSON.stringify(response))
    });
});

retrieve = function(req, res) {

    db.collection(dbCollectionName);
    db.bind(dbCollectionName);

    m = function() {
        emit(this.vote, 1);
    }
    r = function(vote, values) {
        count = 0;
        count += values[i];
        for (i = 0; i < values.length; i++) {}
        return count;
    }
    db.votingcollectionnews.mapReduce(m.toString(), r.toString(), {
        out: 'coll'
    }, function(e, c) {

        db.collection('coll').find().toArray(function(err, result) {
            if (result) {

                var json = JSON.parse(JSON.stringify(result));

                var votes=[];
                for(i=0;i<config.votes.length;i++){
                votes.push(config.votes[i].vote);

              }

              var results = [];
              var n = 4;

							/* reseting result data */
							for (i = 0; i < n; i++) {
                  results[i] = 0;
              }

							/* counting votes */
			 				for(j=0;j<json.length;j++)
             {
               i=votes.indexOf(json[j]._id);
               if(i>-1)
               results[i]=json[j].value;
             }

						 	/* caluclating vote percentage */
                total = eval(results[0]) + eval(results[1]) + eval(results[2]) + eval(results[3]);

                var votesData = [];
                var tempJson = {};

                value = (100 / total) * eval(results[0]);
                tempJson = {

                    "result": value.toFixed(1)
                };
                votesData.push(tempJson);

                value = (100 / total) * eval(results[1]);
                tempJson = {
                    "result": value.toFixed(1)
                };
                votesData.push(tempJson);

                value = (100 / total) * eval(results[2]);
                tempJson = {
                    "result": value.toFixed(1)
                };
                votesData.push(tempJson);

                value = (100 / total) * eval(results[3]);
                tempJson = {
                    "result": value.toFixed(1)
                };
                votesData.push(tempJson);

                var json = {
                    "result": votesData
                };

								/* sending socket message to client */
                io.emit('result', json);
            }

        });
    });
}

/* function create worker for adding/update vote data */
createWorker = function(req, res) {

    var ls = process.spawn('node', ['task2.js']);

    ls.stdout.on('data', function(data) {

        data = data + "";
        if (data == 1 || data == '1') {
            retrieve();

        }
    });

}

/* function to add vote information to the redis queue */
addQueue = function(email, vote, req, res) {
    jobs.create('votequeue', {
        emailId: email,
        userVote: vote
    }).save(function(err) {
        if (!err) {
            createWorker(req, res);
            var result = {
                "result": "successfully added"
            }
            res.send(result)
        } else {
            var error = {
                "error": "Something thing went wrong! Try again"
            }
            res.send(error)
        }
    });


}

//Inserting or Updating the vote data into MongoDB Collection
app.post('/api/insert', function(req, res) {

    var id = req.body.voterEmail;
    addQueue(id, req.body.vote, req, res);
});

//api to insert voter details
app.post('/api/form/insert', function(req, res) {


    var id = req.body.voterEmail;

    Vote.getVoterById(id, function(err, voterData) {
        if (voterData) {
            response = {
                "exist": voterData.vote
            }
            res.json(response)

        } else {

              var voterData = ({
                  _id: req.body.voterEmail,
                  voterEmail: req.body.voterEmail,
                  voterName: req.body.voterName,
                  voterSubscribe: req.body.voterSubscribe,
                  voterOrganization: req.body.voterOrganization
              });

            Vote.addVoter(voterData, function(err, voterData) {
                if (voterData) {
                    response = {
                        "result": "Data inserted succesfully"
                    }

                } else {

                    response = {
                        "error": err
                    }
                }

                res.json(response)
            });

        }

    });

});

app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/public/404.html');

});

http.listen(appEnv.port, '0.0.0.0', function() {
    console.log('listening on *:'+appEnv.port);
});
