const config = require("@root/config");
const MongoClient = require("mongodb").MongoClient;
const logger = require("@root/logger").getLogger("database");
const utils = require("@root/utils");
const postgres = require("postgres");

/* Usage:
	let x = db.whatever.find().toArray();
	let x = db.whatever.findOne({yadda: boo});
	let query = db.psql`SELECT * FROM whatever WHERE yadda = 'boo'`;
*/

var m = {
	client: null,
	db: null,
	psql: null,
	users: null,
	whatever1: null,
	whatever2: null,
};

m.open = () => {
	// connect to psql
	m.psql = postgres(config.postgres.market_db);

	// connect to mongo
	return new MongoClient(config.mongo.uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}).connect().then(cli => {
		m.client = cli;
		m.db = m.client.db(config.mongo.db);
		m.users = m.db.collection("users");
		m.whatever1 = m.db.collection("whatever1");
		m.whatever2 = m.db.collection("whatever2");
		logger.info("DB opened");
	});
}

m.close = () => {
	const mongo = m.client;
	const psql = m.psql;
	m.client = m.db = m.psql = m.users = m.whatever1 = m.whatever2 = undefined;
	logger.debug("Closing client");
	return mongo.close().then(psql.end);
}

module.exports = m;
// vim: set ts=4 sw=4 noet list:
