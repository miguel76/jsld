var jsonld = require('jsonld'),
    _ = require('lodash');

var reservedWords = [
  'context', 'id', 'value', 'language', 'type', 'container', 'list', 'set',
  'reverse', 'index', 'base', 'vocab', 'graph'
];

var forEachProperty = function(node, namedMap, iteratee) {
  return _.forEach(_.filter(_.keys(node), function(key) {
    return key[0] !== '@' || _.indexOf(reservedWords, key.substr(1)) === -1;
  }), function(propertyId) {
    var propertyNode = namedMap[propertyId];
    if (_.isUndefined(propertyNode)) {
      propertyNode = namedMap[propertyId] = { '@id': propertyId };
    }
    iteratee(propertyId, propertyNode);
  });
};

var forEachType = function(node, namedMap, iteratee) {
  var typeValue = node['@type'];
  var types = _.isString(typeValue) ? [typeValue] : (_.isArray(typeValue) ? typeValue : []);
  return _.forEach(types, function(typeId) {
    var typeNode = namedMap[typeId];
    if (_.isUndefined(typeNode)) {
      typeNode = namedMap[typeId] = { '@id': typeId };
    }
    iteratee(typeId, typeNode);
  });
};

var rdfTypeId = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
var forRdfType = function(namedMap, callback) {
  var rdfTypeNode = namedMap[rdfTypeId];
  if (_.isUndefined(rdfTypeNode)) {
    rdfTypeNode = namedMap[rdfTypeId] = { '@id': rdfTypeId };
  }
  callback(rdfTypeId, rdfTypeNode);
};

var addValueInKey = function(subject, key, property, value, options) {
  var val = subject[key];
  if (_.isObject(val)) {
    val = subject[key] = {};
  }
  jsonld.addValue(subject, property, value, options);
};

/**
 * Creates a JS-LD graph representing a JSON-LD graph.
 * The JS-LD graph is a JS representation based on a JSON-LD named map with
 * every link added.
 *
 * @param jsonldInput the JSON-LD input graph.
 * @param options object with options passed directly to jsonld.createNodeMap().
 * @param callback(err, graph) callback function taking an error or the JS-LD graph.
 */
module.exports = function(jsonldInput, options, callback) {
  jsonld.createNodeMap(jsonldInput, options, function(err, nodeMap) {
    if (err) {
      callback(err);
    } else {
      _.forOwn(nodeMap, function(subject) {
        forEachProperty(subject, nodeMap, function(propertyId, propertyNode) {
          var objectRef = subject[propertyId];
          var object = (objectRef['@id'] && nodeMap[objectRef['@id']]) || objectRef;
          addValueInKey(subject, '@out', propertyId, object);
          addValueInKey(object, '@in', propertyId, subject);
          jsonld.addValue(propertyNode, '@domainMember', subject);
          jsonld.addValue(propertyNode, '@rangeMember', object);
        });
        forEachType(subject, nodeMap, function(classId, classNode) {
          forRdfType(nodeMap, function(rdfTypeId, rdfTypeNode) {
            addValueInKey(subject, '@out', rdfTypeId, classNode);
            addValueInKey(classNode, '@in', rdfTypeId, subject);
            jsonld.addValue(rdfTypeNode, '@domainMember', subject);
            jsonld.addValue(rdfTypeNode, '@rangeMember', classNode);
          });
        });
      });
      callback(null, nodeMap);
    }
  });
};
