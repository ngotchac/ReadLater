var path = require('path'),
    merge = require('webpack-merge'),
    CopyWebpackPlugin = require('copy-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    webpack = require('webpack');

// Whether the command is `npm start` or `npm build`
const TARGET = process.env.npm_lifecycle_event;
const PATHS = {
    src: path.join(__dirname, 'src'),
    popup: path.join(__dirname, 'src/popup.js'),
    background: path.join(__dirname, 'src/background.js'),
    style: path.join(__dirname, 'src/style.less'),
    build: path.join(__dirname, 'build')
};

process.env.BABEL_ENV = TARGET;

const common = {
    entry: {
        popup: PATHS.popup,
        background: PATHS.background,
        style: PATHS.style
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
                loader: ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
            },
            {
                test: /\.jsx?$/,
                loaders: ['babel?cacheDirectory'],
                include: PATHS.src
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin('[name].css'),
        new CopyWebpackPlugin(
            [ { from: PATHS.src, to: PATHS.build } ],
            { ignore: [ '*.js', '*.jsx', '*.less' ] }
        )
    ]
};

// When Developing
if (TARGET === 'start') {
    module.exports = merge(common, {
        devtool: 'source-map'
    });
}

if (TARGET === 'build') {
    module.exports = merge(common, {});
}
