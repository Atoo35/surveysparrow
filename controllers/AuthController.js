var passport = require("passport");
var User = require("../models/User");
var crypto = require("crypto");
var validUrl = require('valid-url');
const Links = require("../models/Links");
var userController = {};

userController.home = async (req, res) => {
  if (!req.user)
    res.render('pages/401')
  var list = await Links.find({ 'username': req.user.username })
  list = list.map((item) => {
    return {
      url: item.original,
      shortened: `${process.env.websiteURL}/${item.code}`
    }
  })
  res.render('pages/home', { list });

};
userController.redirect = async (req, res) => {
  if (req.params.code === 'register') {
    res.render('pages/register')
    return
  }
  const dat = await Links.findOne({ code: req.params.code })
  if (dat) {
    res.redirect(dat.original)
  }
  res.render('pages/401')
}

userController.addUrl = async (req, res) => {
  if (!validUrl.isUri(req.body.url)) {
    console.log('Looks like an URI');
    res.send('Invalid URL')
    return;
  }
  var code = crypto.randomBytes(3).toString('hex');
  await Links.create({ 'username': req.user.username, 'original': req.body.url, 'code': code })
  res.send('done')
}

userController.register = function (req, res) {
  res.render('pages/register');
};
// Go to login page
userController.login = function (req, res) {
  res.render('pages/login');
};

// Post login
userController.unauthorized = function (req, res) {
  res.render('pages/401')
}
userController.doLogin = function (req, res) {
  console.log('here')
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/401'
  })(req, res, function () {
    console.log(req.user)
    res.redirect('/home');
  });
};
userController.doRegister = async (req, res) => {
  User.register(new User({ username: req.body.username, name: req.body.username }), req.body.password, async (err, user) => {
    if (err) {
      console.log("am i here?" + err);
      return res.render('pages/register', { user: user });
    }
    res.redirect('/');

  });
};

// logout
userController.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

module.exports = userController;
