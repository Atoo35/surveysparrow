var express = require('express');
var router = express.Router();
var auth = require("../controllers/AuthController.js");

// restrict index for logged in user only
router.get('/', auth.login);
router.get('/home', auth.home);
router.get('/logout',auth.logout)
router.get('/:code',auth.redirect)
router.put('/api/addnew',auth.addUrl)
router.get('/register',auth.register);
router.get('/401',auth.unauthorized);

router.post('/home', auth.doLogin);
router.post('/register',auth.doRegister)
// route for logout action


module.exports = router;
