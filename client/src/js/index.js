/* eslint-disable import/no-extraneous-dependencies */
const Terminal = require("./xterm.min.js");
const FitAddon = require("./fit.min.js");
const Linkify = require("./linkify.min.js");
const validator = require("https://cdnjs.cloudflare.com/ajax/libs/validator/13.7.0/validator.min.js");
const SSH = require("ssh2");

let sessionLogEnable = false;
let loggedData = false;
let sessionLog;
let sessionFooter;
let logDate;
let currentDate;
let myFile;
const term = new Terminal();
// DOM properties
const logBtn = document.getElementById("logBtn");
const downloadLogBtn = document.getElementById("downloadLogBtn");
const status = document.getElementById("status");
const footer = document.getElementById("footer");
const loginform = document.getElementById("loginform");
const terminalwindow = document.getElementById("terminal-container");
const fitAddon = new FitAddon();
const terminalContainer = document.getElementById("terminal-container");
term.loadAddon(fitAddon);
term.open(terminalContainer);
term.focus();
fitAddon.fit();

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
}

function resizeScreen() {
	fitAddon.fit();
}

window.addEventListener("resize", resizeScreen, false);
window.addEventListener(
	"load",
	function () {
		var terminalContainer = document.getElementById("terminal-container");
		var term = new Terminal({ cursorBlink: true, scrollback: 10000, tabStopWidth: 8, bellStyle: "sound" });
		term.open(terminalContainer);
		term.fit();
	},
	false
);
term.onData((data) => {
	term.write(data);
	if (sessionLogEnable) {
		sessionLog += data;
	}
});

document.title = "SSHnake";
drawMenu();

term.onTitleChange((title) => {
	document.title = title;
});

function connectValidate(_host = null, _port = 22, _user = null, _password = null) {
	// capture, assign, and validate variables
	let session = { host: null, username: null, password: null, ssh: null, port: 2 };
	if (_host) {
		if (validator.isIP(`${_host}`) || validator.isFQDN(_host) || /^(([a-z]|[A-Z]|\d|[!^(){}\-_~])+)?\w$/.test(_host)) {
			session.host = _host;
		}
	}
	if (_user && _password) {
		session.username = _user;
		session.userpassword = _password;
	}
	if (validator.isInt(_port)) {
		session.port = _port;
	}
	session.ssh = {
		term: "xterm-color",
		readyTimeout: 20000,
		keepaliveInterval: 120000,
		keepaliveCountMax: 10,
		cols: 200,
		rows: 350,
		header: { text: null, background: "green" },
		algorithms: {
			kex: [
				"ecdh-sha2-nistp256",
				"ecdh-sha2-nistp384",
				"ecdh-sha2-nistp521",
				"diffie-hellman-group-exchange-sha256",
				"diffie-hellman-group14-sha1",
			],
			cipher: [
				"aes128-ctr",
				"aes192-ctr",
				"aes256-ctr",
				"aes128-gcm",
				"aes128-gcm@openssh.com",
				"aes256-gcm",
				"aes256-gcm@openssh.com",
				"aes256-cbc",
			],
			hmac: ["hmac-sha2-256", "hmac-sha2-512", "hmac-sha1"],
		},
	};
	return session;
}
async function setupConnection() {
	let _host = document.getElementById("host").value;
	let _port = 22;
	let _user = document.getElementById("username").value;
	let _password = document.getElementById("password").value;
	const conn = new SSH();
	const session = connectValidate(_host, _port, _user, _password);
	footer.innerHTML = `ssh://${session.username}@${session.host}:${session.port}`;

	conn.on("ready", () => {
		login = true;
		status.innerHTML = "SSH CONNECTION ESTABLISHED";
		status.style.backgroundColor = "green";
		loginform.style.visibility = "hidden";
		terminalwindow.style.visibility = "visible";
		const { term, cols, rows } = session.ssh;
		conn.shell({ term, cols, rows }, (err, stream) => {
			if (err) {
				console.error(`EXEC ERROR` + err);
				conn.end();
				return;
			}
			stream.on("close", (code, signal) => {
				console.debug(`STREAM CLOSE: ${util.inspect([code, signal])}`);
				if (session.username && login === true) {
					console.log(`LOGOUT user=${_username} host=${_host}:${_port}`);
					login = false;
				}
				if (code !== 0 && typeof code !== "undefined")
					console.error("STREAM CLOSE" + util.inspect({ message: [code, signal] }));
				conn.end();
			});
			stream.stderr.on("data", (data) => {
				console.error(`STDERR: ${data}`);
			});
		});
	});

	conn.on("end", (err) => {
		if (err) console.error("CONN END BY HOST" + err);
		console.debug("CONN END BY HOST");
	});
	conn.on("close", (err) => {
		if (err) console.error("CONN CLOSE" + err);
		console.debug("CONN CLOSE");
	});
	conn.on("error", (err) => connError(session, err));

	conn.on("keyboard-interactive", (_name, _instructions, _instructionsLang, _prompts, finish) => {
		console.debug("CONN keyboard-interactive");
		finish([session.password]);
	});
	if (session.username && (session.password || session.privatekey) && session.ssh) {
		const { ssh } = session;
		ssh.username = session.username;
		ssh.password = session.password;
		ssh.tryKeyboard = true;
		conn.connect(ssh);
	} else {
		console.log(
			`CONN CONNECT: Attempt to connect without session.username/password or session variables defined, potentially previously abandoned client session. disconnecting client.\r\n`
		);
	}
}
function connError(session, err) {
	let msg = util.inspect(err);
	if (err?.level === "client-authentication") {
		msg = `Authentication failure user=${session.username}`;
	}
	if (err?.code === "ENOTFOUND") {
		msg = `Host not found: ${err.hostname}`;
	}
	if (err?.level === "client-timeout") {
		msg = `Connection Timeout: ${session.ssh.host}`;
	}
	console.error("CONN ERROR" + msg);
}
