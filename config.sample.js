module.exports = {
	address: "127.0.0.1",
	port: 8081,
	session_store: {
		uri: "mongodb://your-mongo-user:your-mongo-password@localhost:27017/mongo-db-name",
		collection: "web_sessions",
	},
	session: {
		name: "session-name",
		key: "session-key",
		secret: ["session-secret"],
	},
	allowed_origins: [
		"https://your.domain.com",
		"http://localhost",
	],
	firebase: { // https://firebase.google.com/docs/admin/setup#initialize-sdk
		type: "service_account",
		project_id: "your-firebase-id",
		private_key_id: "your-firebase-priv-key-id",
		private_key: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
		client_email: "firebase-adminsdk-...@your-firebase-id.iam.gserviceaccount.com",
		client_id: "your-firebase-client-id",
		auth_uri: "https://accounts.google.com/o/oauth2/auth",
		token_uri: "https://oauth2.googleapis.com/token",
		auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
		client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-...%40your-firebase-id.iam.gserviceaccount.com",
	},
	alpaca: {
		API_KEY: "your-alpaca-api-key",
		API_SECRET: "your-alpaca-api-secret",
	},
	polygon: {
		API_KEY: "your-polygon-api-key",
	},
	mongo: {
		uri: "mongodb://your-mongo-user:your-mongo-password@localhost:27017/mongo-db-name",
	},
	postgres: {
		market_db: "postgres://your-psql-user:@your-psql-password@localhost:5432/psql-db-name",
	},
};
// vim: set ts=4 sw=4 noet list:
