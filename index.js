require("module-alias/register");
const http = require("http");
const option_parser = require("option-parser");

const logger = require("@root/logger").getLogger("index");
// redirect exceptions to the log
process.on("uncaughtException", (err) => {
	logger.fatal(err);
	//process.exit(1);
});

const config = require("@root/config");
const utils = require("@root/utils");
const db = require("@root/database");

// set up the Express engine
const express = require("express");
const app = express();

// set up session store
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const sessionStore = new MongoDBStore(config.session_store);

// parse arguments
const parser = new option_parser();
parser.addOption("h", "help", "Display this help message").action(parser.helpAction());
parser.parse();

// set up app
if (app.get("env") === "production") {
	app.set("trust proxy", 1); // trust first proxy
}
app.use(session({
	...config.session,
	store: sessionStore,
	resave: false,
	saveUninitialized: false,
	proxy: true,
	unset: "destroy",
	cookie: {
		secure: true,
		sameSite: "none",
	},
}));

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.disable("etag"); // Don't want "304 Not Modified" responses when the underlying data has actually changed

app.use((req, res, next) => {
	// Do the CORS rain dance
	if (!req.headers.origin) {
		// Same-origin (FIXME: is it?)
	}
	else if (config.allowed_origins.includes(req.headers.origin)) {
		utils.add_cors_response_headers(res, req.headers.origin);
	}
	else {
		next(utils.error(403, "CORS denied"));
		return;
	}
	// Don't want "304 Not Modified" responses when the underlying data has actually changed
	res.header("Last-Modified", (new Date()).toUTCString());
	next();
});

// Check authentication
const process_auth = require("./process_auth");
app.use((req, res, next) => utils.mwrap(req, res, next, process_auth(req)));

// Register routers
app.use("/v0", require("./rest"));

// Catch 404 and forward to error handler
app.use((req, res, next) => {
	next(utils.error(404, "Not Found: " + req.method + " " + req.originalUrl));
});

// Error handler
app.use((err, req, res, next) => {
	if (err instanceof utils.HTTPError) {
		// don't log stack trace and whatnot for operational http errors
		logger.error(err.status + " " + err.message);
	}
	else {
		logger.error(err);
	}
	res.status(err.status || 500);
	if (err.message) {
		res.send(err.message);
	}
	else {
		res.end();
	}
});

app.set("port", config.port);

// create an http server
const server = http.createServer(app);

// die quickly and noisily if the server can't start up
server.on("error", (error) => {
	if (error.syscall == "listen") {
		switch (error.code) {
			case "EACCES":
				logger.fatal("Address requires elevated privileges;");
				process.exit(1);

			case "EADDRINUSE":
				logger.fatal("Address is already in use;");
				process.exit(1);
		}
	}
	throw error;
});

// exit normally if the server has closed
server.on("close", () => {
	logger.info("Server closed;");
});

// finish the startup when the server has actually started listening
server.on("listening", () => {
	logger.info("Server is listening;");

	// Register handlers for external kill signals
	function cleanup() {
		logger.info("Closing server;");
		server.close();
		process.exit(0);
	}
	process.on("SIGINT", () => { cleanup(); });
	process.on("SIGTERM", () => { cleanup(); });
});

// hijack the server close *call*, so we can close the DB before returning from it
// (the "close" event is asynchronous, it can't delay the closing process)
server.orig_close = server.close;
server.close = function(callback) {
	var session_close = new Promise((resolve, reject) => {
		try {
			sessionStore.close(resolve);
		} catch (err) {
			reject(err);
		}
	});

	return session_close
	.then(db.close)
	.then(() => this.orig_close(callback));
};

// open the db and start listening
db.open().then(() => {
	server.listen(config.port, config.address);
});

module.exports = server;
// vim: set ts=4 sw=4 noet list:
