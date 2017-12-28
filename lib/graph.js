const jsonld = require('jsonld'),
      _ = require('lodash'),
      async = require('async');

const reservedWords = [
  'context', 'id', 'value', 'language', 'type', 'container', 'list', 'set',
  'reverse', 'index', 'base', 'vocab', 'graph'
];

const forEachProperty = function(node, namedMap, reverse, iteratee) {
  _.forEach(_.filter(_.keys(node), function(key) {
    return key[0] !== '@' || _.indexOf(reservedWords, key.substr(1)) === -1;
  }), function(propertyId) {
    var propertyNode = namedMap[propertyId];
    // if (_.isUndefined(propertyNode)) {
    //   propertyNode = namedMap[propertyId] = { '@id': propertyId };
    // }
    iteratee(propertyId, propertyNode, false);
  });
  if (reverse) {
    const reverseProps = node['@reverse'];
    if (reverseProps) {
      _.forEach(_.isArray(reverseProps) ? reverseProps : [reverseProps], (prop) => {
        iteratee(prop, namedMap[prop], true);
      })
    }
  }
};

const forEachPropertyObject = function(node, namedMap, reverse, iteratee) {
  forEachProperty(node, namedMap, reverse, (propertyId, propertyNode, reverse) => {
    var objectsRef = reverse ? node['@reverse'][propertyId] : node[propertyId];
    if (!objectsRef) {
      objectsRef = [];
    } else if (!_.isArray(objectsRef)) {
      objectsRef = [objectsRef];
    }
    _.forEach(objectsRef, (objectRef) => {
      const objectId = _.isObject(objectRef) ? objectRef['@id'] : objectRef;
      const objectNode = (objectId && namedMap[objectId]) || objectRef;
      iteratee(propertyId, propertyNode, objectId, objectNode, reverse);
    })
  });
};

const forEachType = function(node, namedMap, iteratee) {
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

const rdfTypeIri = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
var forRdfType = function(namedMap, callback) {
  var rdfTypeNode = namedMap[rdfTypeIri];
  if (_.isUndefined(rdfTypeNode)) {
    rdfTypeNode = namedMap[rdfTypeIri] = { '@id': rdfTypeIri };
  }
  callback(rdfTypeIri, rdfTypeNode);
};

const addValueInKey = function(subject, key, property, value, options) {
  var val = subject[key];
  if (!_.isObject(val)) {
    val = subject[key] = {};
  }
  var propVal = val[property];
  if (propVal && !_.isArray(propVal)) {
    propVal = val[property] = [propVal];
  }
  if (_.isArray(propVal)) {
    propVal.push(value);
  } else {
    val[property] = value;
  }
};

const deleteProperty = function (subjectNode, propertyId, reverse) {
  if (reverse) {
    const reverseProps = subjectNode['@reverse'];
    delete reverseProps[propertyId];
  } else {
    delete subjectNode[propertyId];
  }
};

const addReverseValue = (subjectId, property, objectNode) => {
  var reverseProps = objectNode['@reverse'];
  if (!reverseProps) {
    reverseProps = objectNode['@reverse'] = {};
  }
  var newSubject = {'@id': subjectId};
  jsonld.addValue(reverseProps, property, newSubject);
}

/**
 * Creates a JS-LD graph representing a JSON-LD graph.
 * The JS-LD graph is a JS representation based on a JSON-LD named map with
 * every link added.
 *
 * @param jsonldInput the JSON-LD input graph.
 * @param ctx the context to compact with.
 * @param options object with options passed directly to jsonld.createNodeMap().
 * @param callback(err, graph) callback function taking an error or the JS-LD graph.
 */
module.exports = function(jsonldInput, ctx, options, callback) {
  ctx = ctx || {};
  jsonld.createNodeMap(jsonldInput, options, function(err, nodeMap) {
    if (err) {
      callback(err);
    } else {
      _.forIn(nodeMap, (jsonldNode, subjectIri) => {
        forEachPropertyObject(jsonldNode, nodeMap, false, (propertyId, propertyNode, objectId, objectNode, reverse) => {
          if (objectNode['@id']) {
            addReverseValue(subjectIri, propertyId, objectNode);
          }
        });
        forEachType(jsonldNode, nodeMap, (typeId, typeNode) => {
          addReverseValue(subjectIri, rdfTypeIri, typeNode);
        });
      });
      console.log(JSON.stringify(nodeMap, null, 3));
      async.mapValues(nodeMap, (jsonldNode, iri, cb) => {
        jsonld.compact(jsonldNode, ctx, cb);
      }, (err, compactedNodeMap) => {
        if (err) {
          callback(err);
        } else {
          compactedNodeMap = _.mapKeys(compactedNodeMap, (jsonldNode) => jsonldNode['@id']);
          _.forIn(compactedNodeMap, function(subject) {
            var currProperty = null;
            var currIsReverse = false;
            forEachPropertyObject(subject, compactedNodeMap, true, function(propertyId, propertyNode, objectId, objectNode, reverse) {
              if (propertyId != currProperty || reverse != currIsReverse) {
                deleteProperty(subject, propertyId, reverse);
              }
              if (reverse) {
                jsonld.addValue(subject['@reverse'], propertyId, objectNode);
              } else {
                jsonld.addValue(subject, propertyId, objectNode);
              }
              currProperty = propertyId;
              currIsReverse = reverse;
            });
            forEachType(subject, compactedNodeMap, function(classId, classNode) {
              jsonld.removeValue(subject, '@type', classId);
              jsonld.addValue(subject, '@type', classNode);
              // forRdfType(nodeMap, function(rdfTypeId, rdfTypeNode) {
                // addValueInKey(subject, '@out', rdfTypeId, classNode);
                // addValueInKey(classNode, '@in', rdfTypeId, subject);
                // jsonld.addValue(rdfTypeNode, '@domainMember', subject);
                // jsonld.addValue(rdfTypeNode, '@rangeMember', classNode);
              // });
            });
          });
          console.log(compactedNodeMap);
          callback(null, compactedNodeMap);
        }
      });
    }
  });
};
