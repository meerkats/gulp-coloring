var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var through = require('through2');

var PluginError = gutil.PluginError;

// consts
const PLUGIN_NAME = 'gulp-svgrollout';

/**
 * Determines if this object is a colour, or if it contains a collection of
 * children colours.
 * @param {string} Parent colours name, null if there is no parent.
 * @param {string} The current colours name
 */
module.exports.namingConvention = namingConvention = function (parent_name, child_name) {
    return parent_name ? [parent_name, child_name].join('-') : child_name;
}

/**
 * Determines if this object is a colour, or if it contains a collection of
 * children colours.
 * @param {Object} Colour : Value object
 * @param {string} The name of the parent colour (null if there is no parent)
 * @param {function} Callback for when this method is complete
 */
function processColour(colour, parent_name, next) {
    if (_.isFunction(parent_colour)) {
        next = parent_colour;
        parent_colour = null;
    }

    if (_.isArray(colour.value)) {
        colour.value.forEach( function (item, index, array) {
            return processColour(item, namingConvention(parent_name, colour.colour), next);
        });
    }
    else {
        return next(name, colour.value);
    }
}

/**
 * Builds a collection or colours from a JSON object of Colour : Hex
 * @param {JSON} JSON representation of colour name/hex values
 * @param {function} Callback for when this method is complete
 */
function buildColourValueArray(colours, next) {
    return async.reduce(colours, [], function (colours, item, callback) {
        processColour(item, function (err, colour, hex) {
            if (err) {
                callback(err);
            }
            colours.push({
                name: colour,
                hex: hex
            });
        });
        callback(null, colours);
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
 * Replace the target_colour with replacement_colour in the buffer chunk
 * @param {string} Hex value of the colour to replace
 * @param {string} Hex value of the colour you want to replace with
 */
function replaceBuffered(file, target_colour, replacement_colour) {
    var chunks = String(file.contents).split(target_colour);
    var result = chunks.join(replacement_colour);
    return new Buffer(result);
}

/**
 * Creates a new file for each of the repleacement colours,
 * replacing the target colour with the replacement colour in the svg.
 * @param {string} Colour you want to replace.
 * @param {Array} Colours that you want to replace the target with {colour: colour_name, value: colour_value}.
 * @param {string} The location where the files are to be written to.
 */
module.exports = function (target_colour, replacement_colours, output_directory) {
    return through.obj(function (file, enc, callback) {
        buildColourValueArray(replacement_colours, function (err, colours) {
            var parsedFilePath = parsePath(file.relative);
            var write_path = path.join(__dirname, output_directory, parsedFilePath.dirname);
            if(!fs.existsSync(write_path)) {
                fs.mkdirSync(write_path);
            }
            async.each(colours, function (colour, callback) {
                var write_file_path = path.join(write_path, parsedFilePath.basename + '-' + colour.name + parsedFilePath.extname);
                if (file.isStream()) {
                    this.emit('error', new PluginError(PLUGIN_NAME, 'Stream not supported!'));
                    return callback();
                }
                if (file.isBuffer()) {
                    fs.writeFile(write_file_path, replaceBuffered(file, target_colour, colour.hex), callback);
                }
            }, callback);
        });
    });
});
