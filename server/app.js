const config = require("./config");
const path = require("path");
const crypto = require("crypto");
const nodeRoot = path.dirname(require.main.filename);
const publicPath = path.join(nodeRoot, "client", "public");

const express = require("express");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
	serveClient: false,
	path: "/socket.io",
	origins: ["localhost:2222"],
});
const expressConfig = {
	secret: crypto.randomBytes(20).toString("hex"),
	name: "SSHnake",
	resave: true,
	saveUninitialized: false,
	unset: "destroy",
	ssh: {
		dotfiles: "ignore",
		etag: false,
		extensions: ["htm", "html"],
		index: false,
		maxAge: "1s",
		redirect: false,
		setHeaders(res) {
			res.set("x-timestamp", Date.now());
		},
	},
};
const session = require("express-session")(expressConfig);

const appSocket = require("./socket");
const { connect, notfound, handleErrors } = require("./routes");

// safe shutdown
let remainingSeconds = 30;
let shutdownMode = false;
let shutdownInterval;
let connectionCount = 0;
// eslint-disable-next-line consistent-return
function safeShutdownGuard(req, res, next) {
	if (!shutdownMode) return next();
	res.status(503).end("Service unavailable: Server shutting down");
}
// express
app.use(safeShutdownGuard);
app.use(session);
app.disable("x-powered-by");
app.use(express.urlencoded({ extended: true }));
app.post("/host/:host?", connect);
app.post("/", express.static(publicPath, expressConfig));
app.use("/", express.static(publicPath, expressConfig));
app.get("/host/:host?", connect);
app.post("/submit", (req, res) => {
	connect(req, res, req.body.host, req.body.username, req.body.userpassword);
});
app.get("/", (req, res) => {
	res.sendFile(path.join(path.join(publicPath, "login.html")));
});
app.get("/login", (req, res) => {
	res.sendFile(path.join(path.join(publicPath, "login.html")));
});
app.use(notfound);
app.use(handleErrors);
// clean stop
function stopApp(reason) {
	shutdownMode = false;
	if (reason) console.info(`Stopping: ${reason}`);
	clearInterval(shutdownInterval);
	io.close();
	server.close();
}

// bring up socket
io.on("connection", appSocket);

// socket.io
// expose express session with socket.request.session
io.use((socket, next) => {
	socket.request.res ? session(socket.request, socket.request.res, next) : next(next); // eslint disable-line
});

function countdownTimer() {
	if (!shutdownMode) clearInterval(shutdownInterval);
	remainingSeconds -= 1;
	if (remainingSeconds <= 0) {
		stopApp("Countdown is over");
	} else io.emit("shutdownCountdownUpdate", remainingSeconds);
}

const signals = ["SIGTERM", "SIGINT"];
signals.forEach((signal) =>
	process.on(signal, () => {
		if (shutdownMode) stopApp("Safe shutdown aborted, force quitting");
		if (!connectionCount > 0) stopApp("All connections ended");
		shutdownMode = true;
		console.error(
			`\r\n${connectionCount} client(s) are still connected.\r\nStarting a ${remainingSeconds} seconds countdown.\r\nPress Ctrl+C again to force quit`
		);
		if (!shutdownInterval) shutdownInterval = setInterval(countdownTimer, 1000);
	})
);

module.exports = { server, config };

const onConnection = (socket) => {
	connectionCount += 1;
	socket.on("disconnect", () => {
		connectionCount -= 1;
		if (connectionCount <= 0 && shutdownMode) {
			stopApp("All clients disconnected");
		}
	});
	socket.on("geometry", (cols, rows) => {
		socket.request.session.ssh.terminfo = { cols, rows };
	});
};

io.on("connection", onConnection);
