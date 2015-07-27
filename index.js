var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');

var PluginError = gutil.PluginError;

// consts
const PLUGIN_NAME = 'gulp-coloring';

var Color = function (name, hex, parent) {
    this.name = Color.getName(name, parent);
    this.hex = hex;
    return this;
};

/**
 * Determines if this object is a color, or if it contains a collection of
 * children colors.
 * @param {string} Parent colors name, null if there is no parent.
 * @param {string} The current colors name
 */
Color.getName = function (name, parent) {
    return parent ? [parent, name].join('-') : name;
};

/**
 * Determines if this object is a color, or if it contains a collection of
 * children colors.
 * @param {Object} Color : Value object
 * @param {string} The name of the parent color (null if there is no parent)
 * @param {function} Callback for when this method is complete
 */
function processColorFamily(color, parent_name, next) {
    if (_.isFunction(parent_name)) {
        next = parent_name;
        parent_name = null;
    }
    // map each child color into a full color
    if (_.isArray(color.value)) {
        return next(null, color.value.map(function (child) {
            return new Color(child.name, child.value, color.name);
        }));
    }
    // return a single color
    return next(null, [new Color(color.name, color.value)]);
}

/**
 * Builds a collection or colors from a JSON object of Color : Hex
 * @param {JSON} JSON representation of color name/hex values
 * @param {function} Callback for when this method is complete
 */
function buildColorValueArray(raw_colors, next) {
    return async.reduce(raw_colors, [], function (colors, color, callback) {
        processColorFamily(color, function (err, family_colors) {
            if (err) {
                return callback(err);
            }
            callback(null, colors.concat(family_colors));
        });
    }, next);
}

/**
 * Helper method that breaks apart a file path into more usable components.
 * @param {Object} Files relative path
 */
function parsePath(file_path) {
    var extname = path.extname(file_path);
    return {
        dirname: path.dirname(file_path),
        basename: path.basename(file_path, extname),
        extname: extname
    };
}

/**
 * Replace the target_color with replacement_color in the buffer chunk
 * @param {string} Hex value of the color to replace
 * @param {string} Hex value of the color you want to replace with
 */
function replaceBuffered(file, target_color, replacement_color) {
    var chunks = String(file.contents).split(target_color);
    var result = chunks.join(replacement_color);
    return new Buffer(result);
}

/**
 * Creates a new file for each of the repleacement colors,
 * replacing the target color with the replacement color in the svg.
 * @param {string} Color you want to replace.
 * @param {Array} Colors that you want to replace the target with {color: color_name, value: color_value}.
 * @param {string} The location where the files are to be written to.
 */
module.exports = function (target_color, replacement_colors, output_directory) {
    return through.obj(function (file, enc, callback) {
        buildColorValueArray(replacement_colors, function (err, colors) {
            if (err) {
                return this.emit('error', new PluginError(PLUGIN_NAME, err));
            }
            var parsedFilePath = parsePath(file.relative);
            var write_path = path.join(output_directory, parsedFilePath.dirname);
            if (!fs.existsSync(write_path)) {
                fs.mkdirSync(write_path);
            }
            async.each(colors, function (color, callback) {
                var write_file_path = path.join(write_path, parsedFilePath.basename + '-' + color.name + parsedFilePath.extname);
                if (file.isStream()) {
                    this.emit('error', new PluginError(PLUGIN_NAME, 'Stream not supported!'));
                    return callback();
                }
                if (file.isBuffer()) {
                    fs.writeFile(write_file_path, replaceBuffered(file, target_color, color.hex), callback);
                }
            }, callback);
        });
    });
};
