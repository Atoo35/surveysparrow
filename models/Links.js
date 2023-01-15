var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LinkSchema = new Schema({
  username: {
    type: String,
    ref: 'User',
    required: true
  },
  original: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
});


module.exports = mongoose.model('Links', LinkSchema);
