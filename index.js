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
  if (delimiters[0].slice(-1) !== '=') {
    delimiters[0] += '(?!=)';
  }

  var source = delimiters[0] + '([\\s\\S]+?)' + delimiters[1];

  // Idea for compile method from http://stackoverflow.com/a/19181804/1267639
  if (!Handlebars._compile) {
    Handlebars._compile = Handlebars.compile;
  }

  Handlebars.compile = function(str) {
    var args = [].slice.call(arguments);
    if (typeof str === 'string') {
      if(delimiters[0] !== '{{' && delimiters[1] !== '}}') {
        args[0] = replaceDelimiters(args[0], source);
      }
    }
    var handle = Handlebars._compile.apply(Handlebars, args);

    return function() {
      var result = handle.apply(this, arguments);
  
      if (delimiters[0] !== '{{' && delimiters[1] !== '}}') {
        return unescapeCurly(result);
      }
    
      return result;
    }
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
  // Replace delimiters with __OPEN__ and __CLOSE__
  var regex = cache[source] || (cache[source] = new RegExp(source, 'g'));
  var match;

  while ((match = regex.exec(str))) {
    var prefix = str.slice(0, match.index);
    var inner = (escape ? '\\' : '') + '__OPEN__' + match[1] + '__CLOSE__';
    var suffix = str.slice(match.index + match[0].length);
    str = prefix + inner + suffix;
  }

  // Replace all remaining curly braces
  str = str.replace(/\{/g, '__OPEN_CURLY__').replace(/\}/g, '__CLOSE_CURLY__');

  // Replace __OPEN__ with {{ and __CLOSE__ with }}
  str = str.replace(/__OPEN__/g, '{{').replace(/__CLOSE__/g, '}}');

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

/**
 * Unescape curly braces that have been escaped
 *
 * ```js
 * var unescaped = replaceCurly(str);
 * ```
 * @name replaceCurly
 * @param {String} `str` String with escaped curly braces to unescape
 * @return {String}
 * @api private
 */
function unescapeCurly(str) {
  return str.replace(/__OPEN_CURLY__/g, '{').replace(/__CLOSE_CURLY__/g, '}');
}


/**
 * Expose `escapeDelimiters` and `replaceDelimiters`
 */

module.exports.replace = replaceDelimiters;
module.exports.escape = escapeDelimiters;
