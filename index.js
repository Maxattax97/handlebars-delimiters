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

/**
 * Pass `Handlebars` and the `delimiters` to use as replacements. This
 * patches the `Handlebars.compile` method to automatically use the
 * custom delimiters when compiling.
 *
 * ```js
 * var delimiters = require('handlebars-delimiters');
 * var handlebars = require('handlebars');
 * delimiters(handlebars, ['<%', '%>']);
 * // you can now use handlebars as usual, but with the new delimiters
 * ```
 * @param {Object} `Handlebars`
 * @param {Array} `delimiters` Array with open and close delimiters, like `['<%', '%>']`
 * @return {undefined}
 * @api public
 */

module.exports = function(Handlebars, delimiters) {
  var open = escapeRegExp(delimiters[0]);
  var close = escapeRegExp(delimiters[1]);
  if (open.slice(-1) !== '=') {
    open += '(?!=)';
  }

  var source = open + '([\\s\\S]+?)' + close;

  // Idea for compile method from http://stackoverflow.com/a/19181804/1267639
  if (!Handlebars._compile) {
    Handlebars._compile = Handlebars.compile;
  }

  Handlebars.compile = function(str) {
    var args = [].slice.call(arguments);
    if (typeof str === 'string') {
      if (open !== '{{' && close !== '}}') {
        args[0] = escapeDelimiters(args[0]);
      }
      args[0] = replaceDelimiters(args[0], source);
    }
    return Handlebars._compile.apply(Handlebars, args);
  };
};

/**
 * Replace or delimiters in the given string.
 *
 * ```js
 * var replaced = delimiters.replace(str, ['<%=', '%>']);
 * ```
 * @name .replace
 * @param {String} `str` String with handlebars to replace or escape.
 * @param {String} `source` The delimiters regex source string to conver to a regular expression.
 * @param {Boolean} `escape` If true, replacements are escaped with a double-slash.
 * @return {String}
 * @api public
 */

function replaceDelimiters(str, source, escape) {
  var regex = cache[source] || (cache[source] = new RegExp(source, 'g'));
  var match;

  while ((match = regex.exec(str))) {
    var prefix = str.slice(0, match.index);
    var inner = (escape ? '\\' : '') + '{{' + match[1] + '}}';
    var suffix = str.slice(match.index + match[0].length);
    str = prefix + inner + suffix;
  }
  return str;
}

/**
 * Escape handlebars delimiters in the given string.
 *
 * ```js
 * var escaped = delimiters.escape(str);
 * ```
 * @name .escape
 * @param {String} `str` String with handlebars to replace or escape.
 * @return {String}
 * @api public
 */

function escapeDelimiters(str) {
  return replaceDelimiters(str, '{{([\\s\\S]+?)}}', true);
}

var matchRegExpSymbols = /[.*+?^${}()|[\]\\]/g;

// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
function escapeRegExp(string) {
  return string.replace(matchRegExpSymbols, '\\$&');
}

/**
 * Expose `escapeDelimiters` and `replaceDelimiters`
 */

module.exports.replace = replaceDelimiters;
module.exports.escape = escapeDelimiters;
