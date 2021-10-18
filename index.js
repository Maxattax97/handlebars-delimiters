/*!
 * handlebars-delimiters <https://github.com/jonschlinkert/handlebars-delimiters>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

'use strict';

/**
 * RegExp cache
 */

var cache = {};

var htmlEscapeDelimiters = [
  '__OPENBRACK__{{', '}}__CLOSEBRACK__'
];
var htmlSafeDelimiters = [
  '__OPENBRACK__{{{', '}}}__CLOSEBRACK__'
];
var defaultDelimiters = [].concat(
  htmlEscapeDelimiters,
  htmlSafeDelimiters
);

// For escaping default open delimiter
var matchDefaultOpen = /{{(?!{)/g;

/**
 * Pass `Handlebars` and the `delimiters` to use as replacements. This
 * patches the `Handlebars.compile` method to automatically use the
 * custom delimiters when compiling.
 *
 * ```js
 * var delimiters = require('handlebars-delimiters');
 * var handlebars = require('handlebars');
 * delimiters(handlebars, ['<%', '%>', '<<%', '%>>']);
 * // you can now use handlebars as usual, but with the new delimiters
 * ```
 * @param {Object} `Handlebars`
 * @param {Array.<String|RegExp>} `delimiters` Array with open and close, html-escape and html-safe delimiters, like `['<%', '%>', '<<%', '%>>']`
 * @return {undefined}
 * @api public
 */

module.exports = function(Handlebars, delimiters) {
  var source = [];
  var open, close, o, c;
  // Prepare sources for html-escape and html-safe delimiters
  for (o = 0, c = o + 1; o <= 2; o += 2, c = o + 1) {
    open = delimiterRegExp(delimiters[o], open, defaultDelimiters[o]);
    close = delimiterRegExp(delimiters[c], close, defaultDelimiters[c]);
    if (!(delimiters[o] instanceof RegExp) && open.slice(-1) !== '=') {
      open += '(?!=)';
    }
    source.push(open + '([\\s\\S]+?)' + close);
  }

  // Idea for compile method from http://stackoverflow.com/a/19181804/1267639
  if (!Handlebars._compile) {
    Handlebars._compile = Handlebars.compile;
  }

  Handlebars.compile = function(str) {
    var args = [].slice.call(arguments);
    if (typeof str !== 'string') {
      return Handlebars._compile.apply(Handlebars, args);
    }
    args = args.slice(1);

    // Prepare matched custom delimiters and other parts from unescaped content
    var compileMap = [str];
    compileMap = mapDelimiters(compileMap, source[1], htmlSafeDelimiters);
    compileMap = mapDelimiters(compileMap, source[0], htmlEscapeDelimiters);

    return function(tplArgs) {
      tplArgs = [].slice.call(arguments);
      var result = '';
      compileMap.forEach(function(part) {
        if (typeof part === 'string') {
          // No custom delimiter matched; Escape default open delimiters
          part = part.replace(matchDefaultOpen, '\\$&');
        } else {
          // Custom delimiter matched; get handlebar-ized source
          part = part();
        }
        result += part;
      });
      // Allow Handlebars to compile our resulting template of handlebar-ized
      // custom delimiters and unescape our temporarily escaped default delimiters
      // return result
      return Handlebars._compile
        .apply(Handlebars, [result].concat(args))
        .apply(null, tplArgs)
        .replace(/__OPENBRACK__/g, '')
        .replace(/__CLOSEBRACK__/g, '');
    };
  };
};

// For extracting inner RegExp string (e.g. '/this/gi' to 'this' )
var matchRegExpToString = /^\/\^?(.*)\$?\/[a-z]*$/i;

/**
 * Transforms RegExp or string to string escaped to be used in RegExp.
 * @param {String|RegExp|*} `delimiter`  RegExp or string to escape
 * @param {Array.<String|RegExp|*>} `defaults`  Successive values to use if delimiter is empty
 * @return {String}
 */
function delimiterRegExp(delimiter, defaults) {
  var isRegExp, isString;
  for (var i = 0; i < arguments.length; ++i) {
    delimiter = arguments[i];
    isString = typeof delimiter === 'string';
    isRegExp = !isString && delimiter instanceof RegExp;
    if (isString || isRegExp) {
      return isString ? escapeRegExp(delimiter)
        : delimiter.toString().replace(matchRegExpToString, '$1');
    }
  }
}

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
var matchRegExpSymbols = /[.*+?^${}()|[\]\\]/g;
function escapeRegExp(string) {
  return string.replace(matchRegExpSymbols, '\\$&');
}

function wrapWithDelimiters(content, delimiters) {
  return function() {
    return delimiters[0] + content + delimiters[1];
  };
}

function mapDelimiters(compileMap, source, delimiters) {
  var result = [];
  compileMap.forEach(function(part) {
    if (typeof part !== 'string') {
      result.push(part);
      return;
    }
    var regex = cache[source] || (cache[source] = new RegExp(source));
    var match;
    var str = part;
    while ((match = str.match(regex))) {
      if (match.index > 0) {
        result.push(str.slice(0, match.index));
      }
      result.push(wrapWithDelimiters(match[1], delimiters));
      str = str.slice(match.index + match[0].length);
    }
    if (str.length) {
      result.push(str);
    }
  });
  return result;
}
