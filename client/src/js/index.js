/* eslint-disable import/no-extraneous-dependencies */
import { io } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
const debug = require("debug")("SSHnake");

let sessionLogEnable = false;
let loggedData = false;
let sessionLog;
let sessionFooter;
let logDate;
let currentDate;
let myFile;
let errorExists;
const term = new Terminal();
// DOM properties
const logBtn = document.getElementById("logBtn");
const downloadLogBtn = document.getElementById("downloadLogBtn");
const adjustBtn = document.getElementById("adjustBtn");
const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const status = document.getElementById("status");
const header = document.getElementById("header");
const footer = document.getElementById("footer");
const countdown = document.getElementById("countdown");
const fitAddon = new FitAddon();
const terminalContainer = document.getElementById("terminal-container");
term.loadAddon(fitAddon);
term.open(terminalContainer);
term.focus();
fitAddon.fit();

const socket = io({
	path: "/socket.io",
});

// cross browser method to "download" an element to the local system
// used for our client-side logging feature
function downloadLog() {
	// eslint-disable-line
	if (loggedData === true) {
		myFile = `SSHnake-${logDate.getFullYear()}${
			logDate.getMonth() + 1
		}${logDate.getDate()}_${logDate.getHours()}${logDate.getMinutes()}${logDate.getSeconds()}.log`;
		// regex should eliminate escape sequences from being logged.
		const blob = new Blob(
			[
				sessionLog.replace(
					// eslint-disable-next-line no-control-regex
					/[\u001b\u009b][[\]()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-ORZcf-nqry=><;]/g,
					""
				),
			],
			{
				// eslint-disable-line no-control-regex
				type: "text/plain",
			}
		);
		const elem = window.document.createElement("a");
		elem.href = window.URL.createObjectURL(blob);
		elem.download = myFile;
		document.body.appendChild(elem);
		elem.click();
		document.body.removeChild(elem);
	}
	term.focus();
}
// Set variable to toggle log data from client/server to a varialble
// for later download
function toggleLog() {
	// eslint-disable-line
	if (sessionLogEnable === true) {
		sessionLogEnable = false;
		loggedData = true;
		logBtn.innerHTML = "Start Log";
		currentDate = new Date();
		sessionLog = `${sessionLog}\r\n\r\nLog End for ${sessionFooter}: ${currentDate.getFullYear()}/${
			currentDate.getMonth() + 1
		}/${currentDate.getDate()} @ ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}\r\n`;
		logDate = currentDate;
		term.focus();
	} else {
		sessionLogEnable = true;
		loggedData = true;
		logBtn.innerHTML = "Stop Log";
		downloadLogBtn.style.color = "#000";
		downloadLogBtn.addEventListener("click", downloadLog);
		currentDate = new Date();
		sessionLog = `Log Start for ${sessionFooter}: ${currentDate.getFullYear()}/${
			currentDate.getMonth() + 1
		}/${currentDate.getDate()} @ ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}\r\n\r\n`;
		logDate = currentDate;
		term.focus();
	}
	return false;
}

// draw/re-draw menu and reattach listeners
// when dom is changed, listeners are abandonded
function drawMenu() {
	logBtn.addEventListener("click", toggleLog);
	if (loggedData) {
		downloadLogBtn.addEventListener("click", downloadLog);
		downloadLogBtn.style.display = "block";
	}
	adjustBtn.innerHTML = "↔️ Adjust Window";
	adjustBtn.style.display = "block";
	adjustBtn.addEventListener("click", doResize(colsInput.value, rowsInput.value));
}

function doResize(cols, rows) {
	colsInput.value = "0";
	rowsInput.value = "0";
	term.clear();
	console.log("resizing window");
	socket.emit("resize", { cols: Number(cols), rows: Number(rows) });
	debug(`resize: ${JSON.stringify({ cols: cols, rows: rows })}`);
	return true;
}

function resizeScreen() {
	fitAddon.fit();
	socket.emit("resize", { cols: term.cols, rows: term.rows });
	debug(`resize: ${JSON.stringify({ cols: term.cols, rows: term.rows })}`);
}

window.addEventListener("resize", resizeScreen, false);

term.onData((data) => {
	socket.emit("data", data);
});

socket.on("data", (data) => {
	term.write(data);
	if (sessionLogEnable) {
		sessionLog += data;
	}
});

socket.on("connect", () => {
	socket.emit("geometry", term.cols, term.rows);
	debug(`geometry: ${term.cols}, ${term.rows}`);
});

socket.on("setTerminalOpts", (data) => {
	term.options = data;
});

socket.on("title", (data) => {
	document.title = data;
});

socket.on("menu", () => {
	drawMenu();
});

socket.on("status", (data) => {
	status.innerHTML = data;
});

socket.on("ssherror", (data) => {
	status.innerHTML = data;
	status.style.backgroundColor = "red";
	errorExists = true;
});

socket.on("headerBackground", (data) => {
	header.style.backgroundColor = data;
});

socket.on("header", (data) => {
	if (data) {
		header.innerHTML = data;
		header.style.display = "block";
		// header is 19px and footer is 19px, recaculate new terminal-container and resize
		terminalContainer.style.height = "calc(100% - 38px)";
		resizeScreen();
	}
});

socket.on("footer", (data) => {
	sessionFooter = data;
	footer.innerHTML = data;
});

socket.on("statusBackground", (data) => {
	status.style.backgroundColor = data;
});

socket.on("disconnect", (err) => {
	if (!errorExists) {
		status.style.backgroundColor = "red";
		status.innerHTML = `WEBSOCKET SERVER DISCONNECTED: ${err}`;
	}
	socket.io.reconnection(false);
	countdown.classList.remove("active");
});

socket.on("error", (err) => {
	if (!errorExists) {
		status.style.backgroundColor = "red";
		status.innerHTML = `ERROR: ${err}`;
	}
});

// safe shutdown
let hasCountdownStarted = false;

socket.on("shutdownCountdownUpdate", (remainingSeconds) => {
	if (!hasCountdownStarted) {
		countdown.classList.add("active");
		hasCountdownStarted = true;
	}
	countdown.innerText = `Shutting down in ${remainingSeconds}s`;
});

term.onTitleChange((title) => {
	document.title = title;
});
