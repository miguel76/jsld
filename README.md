# jsonld-graph

Library to create and visit a JS object representation of JSON-LD graphs,
that we call JS-LD.
JS-LD objects respect JSON-LD syntax but all the links between resources are
represented as actual links (they are actual JS graphs, while JSON-LD is always
serialized as a tree).

To explore a graph in JSON-LD notation, the developer has to know the specific
way in which it has been serialized.
Conversely, as JS-LD objects they have only a possible serialization and can be
explored in multiple ways.
