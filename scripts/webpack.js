const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	context: path.resolve("__dirname", "../"),
	mode: "production",
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					ie8: false,
					safari10: false,
					mangle: true,
					keep_fnames: true,
					keep_classnames: true,
				},
			}),
		],
	},
	resolve: {
		extensions: ["", ".js"],
		fallback: {
			assert: false,
			util: false,
			fs: false,
			tls: false,
			"cpu-features": false,
			net: false,
			path: false,
			zlib: false,
			http: false,
			https: false,
			stream: false,
			crypto: false,
			buffer: false,
			dns: false,
			child_process: false,
		},
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
			{
				test: /\.node$/i,
				use: "raw-loader",
			},
			// All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
		],
	},
};
