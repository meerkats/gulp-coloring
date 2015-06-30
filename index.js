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
 * Builds a collection or colours from a JSON object of Colour : Value
 */
function buildColourValueArray(colours, next) {
    function processColour(colour, parent_colour, next) {
        if (_.isFunction(parent_colour)) {
            next = parent_colour;
            parent_colour = null;
        }
        async.each(colour.value, function (item, callback) {
            if (_.isArray(colour.value)) {
                processColour(item, colour.colour, next);
            }
            return callback();
        }, function (err) {
            if (err) {
                next(new PluginError(PLUGIN_NAME, err));
            }
            var colour_name = colour.colour;
            if (parent_colour) {
                colour_name = [parent_colour, colour.colour].join('-');
            }
            if (!_.isArray(colour.value)) {
                return next(null, colour_name, colour.value);
            };
        });
    }

    return async.reduce(colours, [], function (colour_list, item, callback) {
        processColour(item, function (err, colour_name, colour_value) {
            if (err) {
                callback(err);
            }
            colour_list.push({
                colour: colour_name,
                value: colour_value
            });
        });
        callback(null, colour_list);
    }, next);
}

/**
 * Helper method that breaks apart a file path into more usable components.
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
        buildColourValueArray(replacement_colours, function (err, results) {
            var parsedFilePath = parsePath(file.relative);
            var write_path = path.join(__dirname, output_directory, parsedFilePath.dirname);
            if(!fs.existsSync(write_path)) {
                fs.mkdirSync(write_path);
            }
            async.each(results, function (item, callback) {
                var write_file_path = path.join(write_path, parsedFilePath.basename + '-' + item.colour + parsedFilePath.extname);
                if (file.isStream()) {
                    this.emit('error', new PluginError(PLUGIN_NAME, 'Stream not supported!'));
                    return callback();
                }
                if (file.isBuffer()) {
                    fs.writeFile(write_file_path, replaceBuffered(file, target_colour, item.value), callback);
                }
            }, callback);
        });
    });
});

