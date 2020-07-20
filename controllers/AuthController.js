var mongoose = require("mongoose");
var passport = require("passport");
var mongoUtil = require('../mongoUtil')
var User = require("../models/User");
const fs = require('fs');
const fetch = require('node-fetch')
const { exec } = require('child_process');
const { execSync } = require('child_process');
const bashrc='/home/atoo/.bashrc';
var userController = {};

// Restrict access to root page
userController.home = function(req, res) {
  if(!req.user)
    res.render('pages/401')
  var db = mongoUtil.getDb();
  const collection = db.db('node-auth').collection("users");
  collection.findOne({'username':req.user.username}).then((dat)=>{
    console.log(dat.list.length)
    res.render('pages/home',{list:dat.list});
  })


};


userController.register = function(req, res) {
  res.render('pages/register');
};
// Go to login page
userController.login = function(req, res) {

    res.render('pages/login');


};

// Post login
userController.unauthorized = function(req,res){
  res.render('pages/401')
}
userController.doLogin = function(req, res) {
  passport.authenticate('local',{ successRedirect: '/home',
                                   failureRedirect: '/401' })(req, res, function () {
      // console.log(req.user)
    res.redirect('/home');
  });
};
userController.doRegister = function(req, res) {
  User.register(new User({ username : req.body.username, name: req.body.username }), req.body.password, function(err, user) {
    if (err) {
      console.log("am i here?"+err);
      return res.render('pages/register', { user : user });
    }
    var list=[]
    const db = mongoUtil.getDb();
    const collection = db.db('node-auth').collection("users");
    collection.updateOne(
      {'username':req.body.username},
      {$set:{'list':list}}
    )
      res.redirect('/');

  });
};

// logout
userController.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

module.exports = userController;
