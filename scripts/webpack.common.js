/* eslint-disable import/no-extraneous-dependencies */
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	context: path.resolve("__dirname", "../"),
	resolve: {
		extensions: ["", ".webpack.js", ".web.js", ".js"],
	},
	entry: {
		sshnake: "./client/src/js/index.js",
	},
	plugins: [
		new CleanWebpackPlugin(),
		new CopyWebpackPlugin({
			patterns: [
				"./client/src/login.html",
				"./client/src/client.html",
				"./client/src/favicon.ico",
				"./client/src/sshnake.css",
			],
		}),
	],
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "../client/public"),
	},
	module: {
		rules: [
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
			{
				test: /\.js$/,
				include: [path.resolve(__dirname, "src", "client")],
				use: [
					{
						loader: "babel-loader",
						options: {
							plugins: [["import", { libraryName: "antd", style: true }, "antd"]],
						},
					},
				],
			},
		],
	},
};
