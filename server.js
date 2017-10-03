var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;

app.use(express.static('public'));
app.use(express.static('views'));

app.get("/", function (req, res) {
  res.sendFile("/index.html");
});

app.get("/*", function (req, res) {
  var original_url = req.params[0];
  var regex = /^https?:\/\/www\.[A-Za-z0-9]+\.[a-zA-Z]{3}.*$/;
  var hashcode = getHashcode(original_url);
  if (regex.test(original_url)) {
    insert(hashcode, original_url);
    res.send({ original_url: original_url, short_url: "https://rough-hardcover.glitch.me/" + hashcode});
  } else if (/^[0-9]{4}/.test(original_url)) {
    mongo.connect("mongodb://" + DB_USERNAME + ":" + DB_PASSWORD + "@ds137101.mlab.com:37101/url_shortener", function(err, db) {
      if (err) throw err;
      var collection = db.collection("urls");
      collection.find({
        hashcode: parseInt(original_url)
      }).toArray(function(err, documents) {
        if (err) return console.log(err);
        console.log(documents);
        if (documents.length === 0) {
          res.send({ error: "This url is not on the database." });
        } else {
          res.redirect(documents[0].original_url);
        }
      })
    }) 
  } else {
    res.send({ error: "URL invalid" });
  } 
});

function getHashcode(str) {
  var hashcode = 0; 
  var i, chr;
  for (i = 0; i < str.length; i++) {
    hashcode = (31 * hashcode + str.charCodeAt(i)) % 10000;
  }
  return hashcode;
};

function insert(hashcode, original_url) {
  mongo.connect("mongodb://" + DB_USERNAME + ":" + DB_PASSWORD + "@ds137101.mlab.com:37101/url_shortener", function(err, db) {
    if (err) throw err;
    var collection = db.collection("urls");
    collection.insert({
      hashcode: hashcode, 
      original_url: original_url
    }, function(err) {
      if (err) throw err;
      db.close();  
    })
  })
}

app.listen(8080, function () {
  console.log("Server start at port: 8080");
});
