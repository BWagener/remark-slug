(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mdastSlug = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer
 * @license MIT
 * @module mdast:slug
 * @fileoverview Add anchors to mdast heading nodes.
 */

'use strict';

/*
 * Dependencies.
 */

var toString = require('mdast-util-to-string');
var visit = require('unist-util-visit');
var repeat = require('repeat-string');

var slugg = null;
var fs = {};
var path = {};
var proc = {};

try {
    slugg = require('slugg');
} catch (exception) {/* empty */}

try {
    fs = require('fs');
} catch (exception) {/* empty */}

try {
    path = require('path');
} catch (exception) {/* empty */}

/*
 * Hide process use from browserify and component.
 */

/* istanbul ignore else */
if (typeof global !== 'undefined' && global.process) {
    proc = global.process;
}

/*
 * Methods.
 */

var exists = fs.existsSync;
var resolve = path.resolve;

/*
 * Constants.
 */

var MODULES = 'node_modules';
var EXTENSION = '.js';
var NPM = 'npm';
var GITHUB = 'github';
var SLUGG = 'slugg';
var DASH = '-';

var DEFAULT_LIBRARY = GITHUB;

/**
 * Find a library.
 *
 * @param {string} pathlike - File-path-like to load.
 * @return {Object}
 */
function loadLibrary(pathlike) {
    var cwd;
    var local;
    var npm;
    var plugin;

    if (pathlike === SLUGG && slugg) {
        return slugg;
    }

    cwd = proc.cwd && proc.cwd();

    /* istanbul ignore if */
    if (!cwd) {
        throw new Error('Cannot lazy load library when not in node');
    }

    local = resolve(cwd, pathlike);
    npm = resolve(cwd, MODULES, pathlike);

    if (exists(local) || exists(local + EXTENSION)) {
        plugin = local;
    } else if (exists(npm)) {
        plugin = npm;
    } else {
        plugin = pathlike;
    }

    return require(plugin);
}

/**
 * Wraps `slugg` to generate slugs just like npm would.
 *
 * @see https://github.com/npm/marky-markdown/blob/9761c95/lib/headings.js#L17
 *
 * @param {function(string): string} library - Value to
 *   slugify.
 * @return {function(string): string}
 */
function npmFactory(library) {
    /**
     * Generate slugs just like npm would.
     *
     * @param {string} value - Value to slugify.
     * @return {string}
     */
    function npm(value) {
        return library(value).replace(/[<>]/g, '').toLowerCase();
    }

    return npm;
}

/**
 * Wraps `slugg` to generate slugs just like GitHub would.
 *
 * @param {function(string): string} library - Library to
 *   use.
 * @return {function(string): string}
 */
function githubFactory(library) {
    /**
     * Hacky.  Sometimes `slugg` uses `replacement` as an
     * argument to `String#replace()`, and sometimes as
     * a literal string.
     *
     * @param {string} $0 - Value to transform.
     * @return {string}
     */
    function separator($0) {
        var match = $0.match(/\s/g);

        if ($0 === DASH) {
            return $0;
        }

        return repeat(DASH, match ? match.length : 0);
    }

    /**
     * @see seperator
     * @return {string}
     */
    function dash() {
        return DASH;
    }

    separator.toString = dash;

    /**
     * Generate slugs just like GitHub would.
     *
     * @param {string} value - Value to slugify.
     * @return {string}
     */
    function github(value) {
        return library(value, separator).toLowerCase();
    }

    return github;
}

/**
 * Attacher.
 *
 * @return {function(node)}
 */
function attacher(mdast, options) {
    var settings = options || {};
    var library = settings.library || DEFAULT_LIBRARY;
    var isNPM = library === NPM;
    var isGitHub = library === GITHUB;

    if (isNPM || isGitHub) {
        library = SLUGG;
    }

    if (typeof library === 'string') {
        library = loadLibrary(library);
    }

    if (isNPM) {
        library = npmFactory(library);
    } else if (isGitHub) {
        library = githubFactory(library);
    }

    /**
     * Adds an example section based on a valid example
     * JavaScript document to a `Usage` section.
     *
     * @param {Node} ast - Root node.
     */
    function transformer(ast) {
        visit(ast, 'heading', function (node) {
            if (!node.attributes) {
                node.attributes = {};
            }

            node.attributes.id = library(toString(node));
        });
    }

    return transformer;
}

/*
 * Expose.
 */

module.exports = attacher;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"fs":undefined,"mdast-util-to-string":2,"path":undefined,"repeat-string":3,"slugg":4,"unist-util-visit":5}],2:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module mdast:util:to-string
 * @fileoverview Utility to get the text value of a node.
 */

'use strict';

/**
 * Get the value of `node`.  Checks, `value`,
 * `alt`, and `title`, in that order.
 *
 * @param {Node} node - Node to get the internal value of.
 * @return {string} - Textual representation.
 */
function valueOf(node) {
    return node &&
        (node.value ? node.value :
        (node.alt ? node.alt : node.title)) || '';
}

/**
 * Returns the text content of a node.  If the node itself
 * does not expose plain-text fields, `toString` will
 * recursivly try its children.
 *
 * @param {Node} node - Node to transform to a string.
 * @return {string} - Textual representation.
 */
function toString(node) {
    return valueOf(node) ||
        (node.children && node.children.map(toString).join('')) ||
        '';
}

/*
 * Expose.
 */

module.exports = toString;

},{}],3:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}

/**
 * Results cache
 */

var res = '';
var cache;

},{}],4:[function(require,module,exports){
(function (root) {

var defaultSeparator = '-'

function slugg(string, separator, toStrip) {

  // Separator is optional
  if (typeof separator === 'undefined') separator = defaultSeparator

  // Separator might be omitted and toStrip in its place
  if (separator instanceof RegExp) {
    toStrip = separator
    separator = defaultSeparator
  }

  // Only a separator was passed
  if (typeof toStrip === 'undefined') toStrip = new RegExp('')

  // Swap out non-english characters for their english equivalent
  for (var i = 0, len = string.length; i < len; i++) {
    if (chars[string.charAt(i)]) {
      string = string.replace(string.charAt(i), chars[string.charAt(i)])
    }
  }

  string = string
    // Make lower-case
    .toLowerCase()
    // Strip chars that shouldn't be replaced with separator
    .replace(toStrip, '')
    // Replace non-word characters with separator
    .replace(/[\W|_]+/g, separator)
    // Strip dashes from the beginning
    .replace(new RegExp('^' + separator + '+'), '')
    // Strip dashes from the end
    .replace(new RegExp(separator + '+$'), '')

  return string

}

// Conversion table. Modified version of:
// https://github.com/dodo/node-slug/blob/master/src/slug.coffee
var chars = slugg.chars = {
  // Latin
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A', 'Æ': 'AE',
  'Ç': 'C', 'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E', 'Ì': 'I', 'Í': 'I',
  'Î': 'I', 'Ï': 'I', 'Ð': 'D', 'Ñ': 'N', 'Ò': 'O', 'Ó': 'O', 'Ô': 'O',
  'Õ': 'O', 'Ö': 'O', 'Ő': 'O', 'Ø': 'O', 'Ù': 'U', 'Ú': 'U', 'Û': 'U',
  'Ü': 'U', 'Ű': 'U', 'Ý': 'Y', 'Þ': 'TH', 'ß': 'ss', 'à': 'a', 'á': 'a',
  'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'æ': 'ae', 'ç': 'c', 'è': 'e',
  'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
  'ð': 'd', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
  'ő': 'o', 'ø': 'o', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', 'ű': 'u',
  'ý': 'y', 'þ': 'th', 'ÿ': 'y', 'ẞ': 'SS', 'œ': 'oe', 'Œ': 'OE',
  // Greek
  'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h',
  'θ': '8', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': '3',
  'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y', 'φ': 'f',
  'χ': 'x', 'ψ': 'ps', 'ω': 'w', 'ά': 'a', 'έ': 'e', 'ί': 'i', 'ό': 'o',
  'ύ': 'y', 'ή': 'h', 'ώ': 'w', 'ς': 's', 'ϊ': 'i', 'ΰ': 'y', 'ϋ': 'y',
  'ΐ': 'i', 'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z',
  'Η': 'H', 'Θ': '8', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N',
  'Ξ': '3', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y',
  'Φ': 'F', 'Χ': 'X', 'Ψ': 'PS', 'Ω': 'W', 'Ά': 'A', 'Έ': 'E', 'Ί': 'I',
  'Ό': 'O', 'Ύ': 'Y', 'Ή': 'H', 'Ώ': 'W', 'Ϊ': 'I', 'Ϋ': 'Y',
  // Turkish
  'ş': 's', 'Ş': 'S', 'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
  // Russian
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': 'u',
  'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'А': 'A', 'Б': 'B',
  'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z',
  'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
  'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
  'Ц': 'C', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sh', 'Ъ': 'U', 'Ы': 'Y',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  // Ukranian
  'Є': 'Ye', 'І': 'I', 'Ї': 'Yi', 'Ґ': 'G',
  'є': 'ye', 'і': 'i', 'ї': 'yi', 'ґ': 'g',
  // Czech
  'č': 'c', 'ď': 'd', 'ě': 'e', 'ň': 'n', 'ř': 'r', 'š': 's',
  'ť': 't', 'ů': 'u', 'ž': 'z', 'Č': 'C', 'Ď': 'D', 'Ě': 'E',
  'Ň': 'N', 'Ř': 'R', 'Š': 'S', 'Ť': 'T', 'Ů': 'U', 'Ž': 'Z',
  // Polish
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ś': 's',
  'ź': 'z', 'ż': 'z', 'Ą': 'A', 'Ć': 'C', 'Ę': 'e', 'Ł': 'L',
  'Ń': 'N', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z',
  // Latvian
  'ā': 'a', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l',
  'ņ': 'n', 'ū': 'u', 'Ā': 'A', 'Ē': 'E', 'Ģ': 'G', 'Ī': 'i',
  'Ķ': 'k', 'Ļ': 'L', 'Ņ': 'N', 'Ū': 'u'
}

// Be compatible with different module systems

if (typeof define !== 'undefined' && define.amd) {
  // AMD
  define([], function () {
    return slugg
  })
} else if (typeof module !== 'undefined' && module.exports) {
  // CommonJS
  module.exports = slugg
} else {
  // Script tag
  root.slugg = slugg
}

}(this))

},{}],5:[function(require,module,exports){
/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module unist:util:visit
 * @fileoverview Utility to recursively walk over unist nodes.
 */

'use strict';

/**
 * Walk forwards.
 *
 * @param {Array.<*>} values - Things to iterate over,
 *   forwards.
 * @param {function(*, number): boolean} callback - Function
 *   to invoke.
 * @return {boolean} - False if iteration stopped.
 */
function forwards(values, callback) {
    var index = -1;
    var length = values.length;

    while (++index < length) {
        if (callback(values[index], index) === false) {
            return false;
        }
    }

    return true;
}

/**
 * Walk backwards.
 *
 * @param {Array.<*>} values - Things to iterate over,
 *   backwards.
 * @param {function(*, number): boolean} callback - Function
 *   to invoke.
 * @return {boolean} - False if iteration stopped.
 */
function backwards(values, callback) {
    var index = values.length;
    var length = -1;

    while (--index > length) {
        if (callback(values[index], index) === false) {
            return false;
        }
    }

    return true;
}

/**
 * Visit.
 *
 * @param {Node} tree - Root node
 * @param {string} [type] - Node type.
 * @param {function(node): boolean?} callback - Invoked
 *   with each found node.  Can return `false` to stop.
 * @param {boolean} [reverse] - By default, `visit` will
 *   walk forwards, when `reverse` is `true`, `visit`
 *   walks backwards.
 */
function visit(tree, type, callback, reverse) {
    var iterate;
    var one;
    var all;

    if (typeof type === 'function') {
        reverse = callback;
        callback = type;
        type = null;
    }

    iterate = reverse ? backwards : forwards;

    /**
     * Visit `children` in `parent`.
     */
    all = function (children, parent) {
        return iterate(children, function (child, index) {
            return child && one(child, index, parent);
        });
    };

    /**
     * Visit a single node.
     */
    one = function (node, index, parent) {
        var result;

        index = index || (parent ? 0 : null);

        if (!type || node.type === type) {
            result = callback(node, index, parent || null);
        }

        if (node.children && result !== false) {
            return all(node.children, node);
        }

        return result;
    };

    one(tree);
}

/*
 * Expose.
 */

module.exports = visit;

},{}]},{},[1])(1)
});