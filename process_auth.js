const logger = require("@root/logger").getLogger("auth");
const config = require("@root/config")
const db = require("@root/database");
const utils = require("@root/utils");


/*
 * https://firebase.google.com/docs/admin/setup
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens
 */
const fba = require("firebase-admin");
fba.initializeApp({
  credential: fba.credential.cert(config.firebase),
  // databaseURL: `https://${config.firebase.project_id}.firebaseio.com`,
});


function get_backend_user(req, decodedToken) {
	// https://firebase.google.com/docs/reference/admin/node/admin.auth.DecodedIdToken
	logger.debug(`decodedToken=${JSON.stringify(decodedToken)}`);
	// decodedToken={"name":"Your Name","picture":"https://lh4.googleusercontent.com/.../photo.jpg","iss":"https://securetoken.google.com/your-firebase-id","aud":"your-firebase-id","auth_time":1603797293,"user_id":"uk...X2","sub":"uk...X2","iat":...,"exp":...,"email":"your.address@your.domain.com","email_verified":true,"firebase":{"identities":{"google.com":["10...7"],"email":["your.address@your.domain.com"]},"sign_in_provider":"google.com"},"uid":"uk...X2"}
	return db.users.findOne({ email: decodedToken.email, }, { projection: { _id: false, } }).then(result => {
		// FIXME: handle banned/disabled accounts
		const user_agent = req.get("User-Agent");
		logger.debug(`Sign-in successful, user_agent=${JSON.stringify(user_agent)}, result=${JSON.stringify(result)}`);
		if (result) {
			// known user, retrieve his internal fields
			for (const [k, v] of Object.entries(result)) {
				req.session[k] = v;
			}
			//req.session.cookie.expires = new Date((decodedToken.exp - 5) * 1000); // let the cookie expire 5 seconds earlier than the token
			req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 year, FIXME: for desktop it should be in the hour range, for mobiles maybe infinite
		}
		else {
			// new user, reject
			const msg = `Unknown user ${req.session.email}`;
			logger.error(msg);
			throw utils.error(403, msg);
			/*
			let new_user = {
				... clients.default_user_data,
				email: decodedToken.email,
				provider: decodedToken.sign_in_provider,
				name: decodedToken.name,
				photo_url: decodedToken.picture,
			};
			return db.users().insertOne(new_user).then(() => undefined);
			*/
		}
	});
}


function process_auth(req) {
	if (req.method == "OPTIONS") {
		return Promise.resolve();
	}

	// For development ONLY
	const x_real_ip = req.get("X-Real-IP");
	if (x_real_ip && (x_real_ip == "127.0.0.1")) {
		const fakeToken = {
			name: req.get("X-Test-Name") || "Test User",
			email: req.get("X-Test-Email") || "test.user@your.domain.com",
			firebase: {
				sign_in_provider: "google.com",
			},
			exp: Math.round(new Date().getTime() / 1000) + 600, // valid for 10 minutes
		}; 
		return get_backend_user(req, fakeToken);
	}

	const bearer_token = req.get("Authorization");
	if (!bearer_token) {
		if (!req.session || !req.session.email) {
			logger.debug("No session, no token, going anonymous");
			delete req.session.email;
		}
		return Promise.resolve();
	}

	if (!bearer_token.startsWith("Bearer ")) {
		logger.error(`Invalid bearer token '${bearer_token}'`);
		throw utils.error(401, "ID token must start with 'Bearer '");
	}

	logger.debug("No session but token present, doing sign-in");
	return fba.auth().verifyIdToken(bearer_token.substring(7))
		.catch(err => { throw utils.error(403, err); })
		.then(decodedToken => get_backend_user(req, decodedToken));
}

module.exports = process_auth;
// vim: set ts=4 sw=4 noet list:
