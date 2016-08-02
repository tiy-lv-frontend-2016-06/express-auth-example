var express = require('express');
var app = express();
var db = require('./db.json');
var v4 = require('uuid').v4;
var bodyParser = require('body-parser');
var jsonfile = require('jsonfile');
var sha1 = require('sha1');

function hash(str) {
  var salt = '4ffGUnFNEV';
  return sha1(str + salt);
}

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.get("/", function(req, res){
  res.send("This is our API");
});

app.post("/register", function(req, res){
  var userObj = {username: req.body.username, password: hash(req.body.password)};

  var userExists = db.users.filter(function(user){
    return user.username === userObj.username;
  }).length > 0;

  if (!userExists) {
    userObj.id = v4();
    db.users.push(userObj);
    jsonfile.writeFile("./db.json", db, {spaces:2}, function(err){
      if (err) {console.log(err)}
      res.json({id: userObj.id, username:userObj.username});
    })
  } else {
    res.status(409);
    res.json({'err':'User already exists'});
  }
});

app.post("/token", function(req, res) {
  var userObj = {username: req.body.username, password: hash(req.body.password)};

  var userExists = db.users.filter(function(user){
    return user.username === userObj.username;
  }).length > 0;

  if (!userExists) {
    res.status(404);
    res.json({'err':'User not found'});
  } else {
    var checkpass = db.users.filter(function(user){
      return user.password === userObj.password && user.username === userObj.username
    }).length > 0;
    if (checkpass) {
      var token = v4();
      db.users = db.users.map(function(user){
        if (user.username === userObj.username) {
          return {
            username: user.username,
            password: user.password,
            id: user.id,
            token: token
          }
        } else {
          return user
        }
      });
      jsonfile.writeFile("./db.json", db, {spaces:2}, function(err){
        if (err) {console.log(err)}
        res.json({token: token});
      })
    } else {
      res.status(401);
      res.json({'err':'Unauthorized'});
    }
  }
});

app.get('/user', function(req, res){
  var token = req.get('Authorization') ? req.get('Authorization').substr(6) : false;
  if (!token) {
    res.status(401);
    res.json({"err":"Unauthorzied"});
  } else {
    var userArr = db.users.filter(function(user){
      return user.token === token
    });

    if (userArr.length > 0) {
      res.json({username: userArr[0].username, id:userArr[0].id});
    } else {
      res.status(404);
      res.json({"err":"Not found"})
    }
  }
});

app.listen(3000, function(){
  console.log("Running on port 3000");
});