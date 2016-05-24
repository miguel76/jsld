var jsonld = require('jsonld'),
    visitWrap = require('./visit');

var doNothing = function () {};

/**
 * Creates a function running a depth first visit on a JS-LD graph, executing some actions.
 *
 * Both parentInVisit and each childInVisit are objects with the following keys:
 *   node the node reference (a parent in preAction() or a child in postAction())
 *   value the value returned by the function (preAction() or postAction()) on that node
 *   leadingProperty the property connecting the current node with this one
 *   leadingPropertyIsReverse true if the connection is through the reverse of the property
 *
 * @param options the options to use:
 *          [preAction(node, parentInVisit)] function executed while going down the depth-first tree.
 *          [postAction(node, [childInVisit1, childInVisit2, ... childInVisitn], preActionValue)] function executed while going up the depth-first tree.
 *          [outEdges] follow outgoing edges (default: true).
 *          [inEdges] follow ingoing edges (default: false).
 * @return a function(node) that run the depth-first visit starting from node and finally returns the postAction() result for node
 */
var depthFirst = function(options) {
  var outEdges = !!options.outEdges;
  var inEdges = (typeof options.inEdges !== 'undefined') && !!options.inEdges;
  var preAction = (typeof options.preAction === 'function') ? options.preAction : doNothing;
  var postAction = (typeof options.postAction === 'function') ? options.postAction : doNothing;

  var parentValue = null;
  var parentNode = null;
  var parentProperty = null;
  var parentPropertyIsReverse = null;
  return visitWrap(function (node, visit) {
    var preActionValue = parentValue = preAction(node, {
      value: parentValue, node: parentNode, leadingProperty: parentProperty,
      leadingPropertyIsReverse: parentPropertyIsReverse});
    parentNode = node;
    var children = [];

    var visitProperties = function(fromHere, isReverse) {
      parentPropertyIsReverse = isReverse;
      for (var prop in fromHere) {
        if (prop !== '@id') {
          parentProperty = prop;
          jsonld.getValues(fromHere, prop).map(function(childNode) {
            children.push({
              value: visit(childNode),
              node: childNode,
              leadingProperty: prop,
              leadingPropertyIsReverse: isReverse
            });
          });
        }
      }
    };

    if (outEdges) {
      visitProperties(node, false);
    }
    if (inEdges && '@reverse' in node) {
      visitProperties(node['@reverse'], true);
    }

    return postAction(node, children, preActionValue);
  });
};

module.exports = {
  depthFirst: depthFirst
};
