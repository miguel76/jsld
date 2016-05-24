var jsonld = require('jsonld'),
    _ = require('lodash');

module.exports = function(jsonldInput, options, callback) {
  jsonld.createNodeMap(jsonldInput, options, function(err, nodeMap) {
    if (err) {
      callback(err);
    } else {
      callback(null, _.mapValues(nodeMap, _.partial(_.mapValues, _,
        // Function executed for each object/object-array in the node map
        function(objectOrObjectArray, predicate, subject) {
          // Function executed for each object in the node map
          var mapFunction = function(object) {
            var objectId = object['@id'];
            if (objectId) { // the object is an IRI or bnode
              // If the object is in the node map as subject...
              //   - replace the object with a direct reference to the subject;
              //   - add the backward link from the subject using ["@reverse"].
              var objectNode = nodeMap[objectId];
              if (objectNode) {
                var objectRev = objectNode["@reverse"];
                if (!objectRev) objectRev = objectNode["@reverse"] = {};
                var objectRevPredicate = objectRev[predicate];
                if (_.isObject(objectRevPredicate)) {
                  objectRevPredicate = [ objectRevPredicate ];
                }
                if (_.isArray(objectRevPredicate)) {
                  objectRevPredicate.push(subject);
                } else {
                  objectRev[predicate] = subject;
                }
                return objectNode;
              }
            }
            return object;
          };
          if (_.isArray(objectOrObjectArray)) {
            return _.map(objectOrObjectArray, mapFunction);
          } else {
            return mapFunction(objectOrObjectArray);
          }
        })));
    }
  });
};
