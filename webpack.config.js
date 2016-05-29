var path = require('path'),
    merge = require('webpack-merge'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    webpack = require('webpack');

// Whether the command is `npm start` or `npm build`
const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
    src: path.join(__dirname, 'src'),
    popup: path.join(__dirname, 'src/popup.js'),
    background: path.join(__dirname, 'src/background.js'),
    build: path.join(__dirname, 'build')
};

process.env.BABEL_ENV = TARGET;

const common = {
    entry: {
        popup: PATHS.popup,
        background: PATHS.background
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: PATHS.build,
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.(css|less)$/,
                loaders: ['style', 'css', 'less'],
                include: PATHS.app
            },
            {
                test: /\.jsx?$/,
                loaders: ['babel?cacheDirectory'],
                include: PATHS.app
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin(
            [ { from: PATHS.src, to: PATHS.build } ],
            { ignore: [ '*.js', '*.jsx', '*.less' ] }
        )
    ]
};

// When Developing
if (TARGET === 'start') {
    module.exports = merge(common, {
        devtool: 'eval-source-map'
    });
}

if (TARGET === 'build') {
    module.exports = merge(common, {});
}
