/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true, "allowTernary": true }],
   no-console: ["error", { allow: ["warn", "error", "info"] }] */
/* jshint esversion: 6, asi: true, node: true */
// logging.js
// private

const util = require("util");

/**
 * generate consistent prefix for log messages
 * with epress session id and socket session id
 * @param {object} socket Socket information
 */
function prefix(socket) {
	return `(${socket.request.sessionID}/${socket.id})`;
}

/**
 * audit log to console
 * @param {object} socket Socket information
 * @param {object} msg    log message
 */
function auditLog(socket, msg) {
	console.info(`SSHnake ${prefix(socket)} AUDIT: ${msg}`);
}

/**
 * logs error to socket client (if connected)
 * and console.
 * @param {object} socket Socket information
 * @param {string} myFunc Function calling this function
 * @param {object} err    error object or error message
 */
function logError(socket, myFunc, err) {
	console.error(`SSHnake ${prefix(socket)} ERROR: ${myFunc}: ${err}`);
	if (!socket.request.session) return;
	socket.emit("ssherror", `SSH ${myFunc}: ${err}`);
}

module.exports = { logError, auditLog };
