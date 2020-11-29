"use strict";

var toString = require("mdast-util-to-string");
var visit = require("unist-util-visit");
var slugs = require("github-slugger")();

module.exports = attacher;

function attacher() {
  return transformer;
}

/* Patch slugs on heading nodes. */
function transformer(ast) {
  slugs.reset();

  visit(ast, "heading", function (node) {
    var id = slugs.slug(replaceUmlaute(toString(node)));
    var data = patch(node, "data", {});

    /* Non-html */
    patch(data, "id", id);
    /* Legacy remark-html */
    patch(data, "htmlAttributes", {});
    /* Current remark-html */
    patch(data, "hProperties", {});
    patch(data.htmlAttributes, "id", id);
    patch(data.hProperties, "id", id);
  });
}

function patch(context, key, value) {
  if (!context[key]) {
    context[key] = value;
  }

  return context[key];
}

const umlautMap = {
  "\u00dc": "UE",
  "\u00c4": "AE",
  "\u00d6": "OE",
  "\u00fc": "ue",
  "\u00e4": "ae",
  "\u00f6": "oe",
  "\u00df": "ss",
};

function replaceUmlaute(str) {
  return str
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, (a) => {
      const big = umlautMap[a.slice(0, 1)];
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(
      new RegExp("[" + Object.keys(umlautMap).join("|") + "]", "g"),
      (a) => umlautMap[a]
    );
}
