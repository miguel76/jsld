var fs = require('fs'),
    graph = require('../index');

var inputStr = fs.readFileSync(__dirname + '/library.jsonld');
var inputJson = JSON.parse(inputStr);

module.exports = function(obj) {
  graph(inputJson, null, function(err, result) {
    if (err) obj.err = err;
    if (result) obj.result = result;
  });
};
