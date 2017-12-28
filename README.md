jsld
====

Introduction
------------

Library to create and visit a JS object representation of [JSON-LD][http://json-ld.org] graphs,
that we call JS-LD.
JS-LD objects respect JSON-LD syntax but all the links between resources are
represented as actual links (they are actual JS graphs, while JSON-LD is always
serialized as a tree).

To explore a graph in JSON-LD notation, the developer has to know the specific
way in which it has been serialized.
Conversely, as JS-LD objects they have only a possible serialization and can be
explored in multiple ways.

## Requiring jsld.js:

### node.js + npm

```
npm install jsld
```

```js
var jsld = require('jsld');
```

## Usage
```js
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
jsld.convert(jsonldInput, ctx, options, callback);
```

## Example of use
```js
var jsldGraph = jsld.convert(jsonldGraph, jsonldContextToCompact, null, function(err, result) {
  if (err) {
    console.log(err);
  } else if (result) {
    ...
  }
}););
```
