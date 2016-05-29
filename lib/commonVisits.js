var _ = require('lodash'),
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
  var outEdges = (typeof options.inEdges === 'undefined') || options.outEdges;
  var inEdges = !!options.inEdges;
  var preAction = (typeof options.preAction === 'function') ? options.preAction : doNothing;
  var postAction = (typeof options.postAction === 'function') ? options.postAction : doNothing;

  return visitWrap(function (node, visit, parentInVisit) {
    var preActionValue = preAction(node, parentInVisit);

    var children = [];
    _.forEach(_.filter([ false, true ], function(isReverse) {
      return (outEdges && !isReverse) || (inEdges && isReverse);
    }), function(isReverse) {
      var key = isReverse ? '@in' : '@out';
      if (key in node) {
        _.forIn(node[key], function(value, property) {
          _.forEach(_.isArray(value) ? value : [value], function(childNode) {
            children.push({
              value: visit(childNode, {
                value: preActionValue,
                node: node,
                leadingProperty: property,
                leadingPropertyIsReverse: isReverse
              }),
              node: childNode,
              leadingProperty: property,
              leadingPropertyIsReverse: isReverse
            });
          });
        });
      }
    });

    return postAction(node, children, preActionValue);
  });
};

module.exports = {
  depthFirst: depthFirst
};
