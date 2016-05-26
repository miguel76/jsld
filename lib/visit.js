/**
 * Wraps a function visiting a JS-LD graph to avoid cycles.
 * If a node has been already visited the previous result is returned without
 * calling the function again.
 *
 * @param visitFunction(node, visit, args...) function that visits a node and recursively calls herself using visit(otherNode, otherArgs..)
 * @param options object with options passed directly to jsonld.createNodeMap().
 * @param callback(err, graph) callback function taking an error or the output graph.
 */
module.exports = function (visitFunction) {
  var visitedNodes = {};
  var visit = function() {
    var args =
        arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
    var node = args.shift();
    var nodeId = node['@id'];
    if (typeof nodeId !== 'undefined') {
      var prevFunctionResult = visitedNodes[nodeId];
      if (typeof prevFunctionResult !== 'undefined') {
        return prevFunctionResult;
      }
    }
    args.unshift(node, visit);
    return visitedNodes[node] = visitFunction.apply(this, args);
  };
  return visit;
};
