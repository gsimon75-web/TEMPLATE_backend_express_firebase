const express = require("express");
const router = express.Router();
const db = require("@root/database");
const logger = require("@root/logger").getLogger("rest");
const utils = require("@root/utils");


function op_healthz(req) {
	logger.debug("GET healthz");
	return null; // 204
}


function op_whoami(req) {
	logger.debug("GET whoami");
	return db.users.findOne(
		{
			email: req.session.email,
		},
		{
			projection: {
				_id: false,
			},
		},
	);
}


function op_logout(req) {
	logger.debug("GET logout");
	req.session.destroy();
	return null;
}


// health check for load balancers
router.get("/healthz",          (req, res, next) => utils.mwrap(req, res, next, () => op_healthz(req)));

// web session handling
router.get("/whoami",           (req, res, next) => utils.mwrap(req, res, next, () => op_whoami(req)));
router.get("/logout",           (req, res, next) => utils.mwrap(req, res, next, () => op_logout(req)));

// sub-endpoints
// router.use("/whatever", require("./whatever"));

module.exports = router;
// vim: set sw=4 ts=4 noet list:
