var fs = require('fs'),
    graph = require('../index');

var inputStr = fs.readFileSync(__dirname + '/library.jsonld');
var inputJson = JSON.parse(inputStr);

var show = function(node) {
  if (node['@id']) return { '@id': node['@id'] };
  if (node['@value']) return { '@value': node['@value'] };
  return node;
};

var depth = 0;

var depthFirst = graph.commonVisits.depthFirst({
  preAction: function(node, parentInVisit) {
    depth++;
    if (depth > 5) throw 'Too much';
    console.log('Going down!');
    console.log('- Now in node:');
    console.log(show(node));
    console.log('- Coming from:');
    console.log(parentInVisit ? {
      node: show(parentInVisit.node),
      leadingProperty: parentInVisit.leadingProperty,
      leadingPropertyIsReverse: parentInVisit.leadingPropertyIsReverse
    } : undefined);
    console.log('- Depth ' + depth);
  },
  postAction: function(node, children, preActionValue) {
    depth--;
    console.log('Going up!');
    console.log('- Now in node:');
    console.log(show(node));
    console.log('- Coming from:');
    console.log(children);
    console.log('Depth ' + depth);
  }
});


graph.makeGraph(inputJson, null, function(err, result) {
  if (err) {
    console.log(err);
  } else if (result) {
    depthFirst(result['http://example.org/library/the-republic']);
  }
});
