var util = require("util");
var sqlite3 = require("sqlite3");
var async = require("async");
var request = require("request");

function main() {
  // validate commandline params
  if(process.argv.length < 4) {
    console.log(util.format("Usage: %s %s <sqlite file path> <elastic search url>",
      process.argv[0], process.argv[1]));
    return;
  }

  var dbFile = process.argv[2];
  var searchUrl = process.argv[3];

  // load all posts
  loadPosts(dbFile, function(err, rows) {
    if(err) {
      console.dir(err);
      return;
    }

    // index all posts
    indexPosts(searchUrl, rows, function(err, results) {
      console.dir(arguments);
    });
  });
}

function indexPosts(url, posts, cb) {
  async.each(posts, function(post, callback) {
    request({
      uri: url + post.id.toString(),
      method: "PUT",
      json: post
    }, function(err, res, body) {
      if(!err) {
        console.dir(body);
      }

      callback(err, {res: res, body: body});
    })
  }, function(err, results) {
    if(cb) {
      cb(err, results);
    }
  });
}

function loadPosts(file, cb) {
  var db = new sqlite3.Database(file, sqlite3.OPEN_READONLY, function(err) {
    if(err) {
      cb(err);
      return;
    }

    db.all("select id, slug, markdown from posts", function(err, rows) {
      cb(err, rows);
    });
  })
}

main();
