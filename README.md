# gulp-svgrollout
Rollout multiple single color SVG icons in multiple colors.

# Usage
```
var svgrollout = require(gulp-svgrollout);
var target = '#000000';
var replace_colours = {
    'colours': [
        { colour: 'white', value: '#ffffff' },
        { colour: 'black', value: '#182124' },
        { colour: 'yellow', value: '#efbd46' },
        { colour: 'red', value: [
            { colour:'flat', value:'#f5644c' },
            { colour:'vibrant', value:'#f54533' }
        ]},
        { colour: 'grey', value: [
            { colour:'30', value:'#b9bcbd'},
            { colour:'20', value:'#ececec'},
            { colour:'10', value:'#f5f5f5'}
        ]}
    ]};

gulp.task('rollouticons', function (callback) {
    return gulp.src(config.files.icons).
        .pipe(svgrollout(target, replace_colours, config.dir.icons));
};
```
For each of the target passed in a new svg file will be created.
An input of `input.svg` in this case will some out as:
- input-white.svg
- input-black.svg
- input-yellow.svg
- input-red-flat.svg
- input-red-vibrant.svg
- input-grey-10.svg
- input-grey-20.svg
- input-grey-30.svg
