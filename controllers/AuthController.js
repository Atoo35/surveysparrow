var mongoose = require("mongoose");
var passport = require("passport");
var mongoUtil = require('../mongoUtil')
var User = require("../models/User");
const fs = require('fs');
var crypto = require("crypto");
const fetch = require('node-fetch')
var validUrl = require('valid-url');
var userController = {};

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
userController.redirect = function(req,res){
  // if(req.params.code === '1234')
  // res.redirect('https://www.google.co.in')
  var db = mongoUtil.getDb();
  const links=db.db('node-auth').collection('Links')

  links.findOne({'links.code':req.body.code}).then((dat)=>{
    if(dat){
      console.log(dat)
      res.redirect(dat.links[0].original)
      return
    }
    else{
      res.render('pages/401')
    }
  })
}

userController.addUrl = function(req,res){
  if (!validUrl.isUri(req.body.url)){
    console.log('Looks like an URI');
    res.send('Invalid URL')
    return;
}
  var db = mongoUtil.getDb();
  const collection = db.db('node-auth').collection("users");
  const links=db.db('node-auth').collection('Links')
  var code=crypto.randomBytes(3).toString('hex');
  var shortenedUrl='https://surveysparrow1.herokuapp.com/'+code
  var linkSave={
    code:code,
    original:req.body.url
  }
  var data={
    url:req.body.url,
    shortened:shortenedUrl
  }
  links.updateOne(
    {'name':'allLinks'},
    {$push:{'links':linkSave}}
  )
  collection.updateOne(
    {'username':req.user.username},
    {$push:{'list':data}}
  ).then((dat)=>{
    console.log(dat)
    res.send('done')})
}
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
