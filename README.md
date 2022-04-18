## Database backend

### Create mongo db, service account, collection

Connect to the db:
`mongo mongodb://trader:***REMOVED***@localhost:27017/trader_db`

```
use trader_db
db.createUser(
    {
        user: "trader",
        pwd: "***REMOVED***",
        roles: [ { role: "readWrite", db: "trader_db", }, ],
        authenticationRestrictions: [ { clientSource: [ "127.0.0.1/32" ], } ],
    },
)

db.createCollection("users")
db.users.insert( { email: "<your email address>" })
```
