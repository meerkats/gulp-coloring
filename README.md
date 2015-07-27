# gulp-coloring

Color in an SVG. Take one SVG and rollout one SVG file per color.

# Usage

```
var coloring = require('gulp-coloring');
var target = '#000000';
var colors = {
    'colors': [
        { color: 'white', value: '#ffffff' },
        { color: 'black', value: '#182124' },
        { color: 'yellow', value: '#efbd46' },
        { color: 'red', value: [
            { color:'flat', value:'#f5644c' },
            { color:'vibrant', value:'#f54533' }
        ]},
        { color: 'grey', value: [
            { color:'30', value:'#b9bcbd'},
            { color:'20', value:'#ececec'},
            { color:'10', value:'#f5f5f5'}
        ]}
    ]
};

gulp.task('icons', function (callback) {
    return gulp.src(config.files.icons).
        .pipe(coloring(target, colors, config.dir.icons));
};
```

For each of the target passed in a new `svg` file will be created. An input of `input.svg` will generate

- `input-white.svg`
- `input-black.svg`
- `input-yellow.svg`
- `input-red-flat.svg`
- `input-red-vibrant.svg`
- `input-grey-10.svg`
- `input-grey-20.svg`
- `input-grey-30.svg`
