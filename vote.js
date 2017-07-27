//Requiring Mongoose
var mongoose = require('mongoose');
var config = require('config.json')('./public/config.json');
//Defining Schema
var voteAppSchema = mongoose.Schema({

  _id: {
      type: String,
      required: true
  },

  voterName: {
      type: String,
      required: true
  },

  voterEmail: {
      type: String,
      required: true
  },

  voterOrganization: {
      type: String,
      required: true
  },

  voterSubscribe: {
      type: String,
      required: true
  },

  vote: {
      type: String,
      required: false
  },

  create_date: {
      type: Date,
      default: Date.now
  }
});

//Exporting the file
var database = module.exports = mongoose.model(config.mongodb.collectionName, voteAppSchema); //Binding schema to databaseCollection


//Module.exports to access the database.js file in anyfile using require
//Getting database Details
module.exports.getDetails = function(callback, limit) {
    database.find(callback).limit(limit);
}

//Getting database Details ById
module.exports.getVoterById = function(id, callback) {
  var query = {
      _id: id
  };
    database.findById(query, callback);
}

//Inserting database Details
module.exports.addVoter = function(voterData, callback) {

    database.create(voterData, callback);
}

//Updating database Details
module.exports.updateVote = function(id, voteData, options, callback) {
  var query = {
      _id: id
  };
  var update = {
      vote: voteData.vote
  }
  database.findOneAndUpdate(query, update, options, callback);
}
