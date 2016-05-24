/**
 * Wraps a function visiting a JS-LD graph to avoid cycles.
 * If a node has been already visited the previous result is returned without
 * calling the function again.
 *
 * @param visitFunction(node, visit) function that visits a node and recursively calls herself using visit(otherNode)
 * @param options object with options passed directly to jsonld.createNodeMap().
 * @param callback(err, graph) callback function taking an error or the output graph.
 */
module.exports = function (visitFunction) {
  var visitedNodes = {};
  var visit = function(node) {
    var nodeId = node['@id'];
    if (typeof nodeId !== 'undefined') {
      var prevFunctionResult = visitedNodes[nodeId];
      if (typeof prevFunctionResult !== 'undefined') {
        return prevFunctionResult;
      }
    }
    return visitedNodes[node] = visitFunction(node, visit);
  };
  visitFunction(node, visit);
};
