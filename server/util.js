/* jshint esversion: 6, asi: true, node: true */
// util.js

// private
const debug = require("debug")("SSHnake");
const Auth = require("basic-auth");

let defaultCredentials = { username: null, password: null, privatekey: null };

exports.setDefaultCredentials = function setDefaultCredentials({
	name: username,
	password,
	privatekey,
	overridebasic,
}) {
	defaultCredentials = { username, password, privatekey, overridebasic };
};

// takes a string, makes it boolean (true if the string is true, false otherwise)
exports.parseBool = function parseBool(str) {
	return str.toLowerCase() === "true";
};
