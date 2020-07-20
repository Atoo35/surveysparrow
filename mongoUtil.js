const MongoClient = require('mongodb').MongoClient;
var _db;
module.exports = {
  connectToServer:function(callback){
    const uri = process.env.mongoUri
    MongoClient.connect(uri,{useUnifiedTopology:true}, function(err, mongoClient) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       _db = mongoClient
       return callback(err);
     });
  },

  getDb:function(){
    return _db;
  }
}
