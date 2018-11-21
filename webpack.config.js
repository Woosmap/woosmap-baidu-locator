"use strict";
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var webpackConfig = {
    entry: ['./app/src/init.js', './app/css/effects.css', './app/css/baidu-integration.css'],

    output: {path: __dirname + '/build', filename: "baidu-integration.js", publicPath: "/"},

    module: {
        loaders: []
    },

    devServer: {
        disableHostCheck: true
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'app/index.html',
            inject: 'head'
        }),
        new ExtractTextPlugin("baidu-integration.css"),
        new CopyWebpackPlugin([
            {from: 'app/images', to: 'images'}
        ]),
    ]
};
webpackConfig.module.loaders.push({
    test: /\.js$/,
    exclude: /node_modules/
});
webpackConfig.module.loaders.push({
    test: /\.css$/,
    exclude: /node_modules/,
    loader: ExtractTextPlugin.extract({fallback: "style-loader", use: "css-loader"})
});

webpackConfig.devtool = 'source-map';

module.exports = webpackConfig;
