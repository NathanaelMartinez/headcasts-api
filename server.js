const express = require("express");
const app = express();

const { OAuth2Client } = require("google-auth-library");

const bodyParser = require("body-parser");

const boats = express.Router();
const owners = express.Router();

boats.use(bodyParser.json());

const { expressjwt: expressJwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const ds = require("./datastore");

const path = require("path");

const secret = require("./client_secrets.json");
const crypto = require("crypto").webcrypto;
const fetch = require("node-fetch");
const { verify } = require("crypto");

app.enable("trust proxy");

const datastore = ds.datastore;

const BOAT = "Boat";
const USER = "User";
const STATE = "State";

const CLIENT_ID = secret.web.client_id;
const CLIENT_SECRET = secret.web.client_secret;
// const REDIRECT_URI = "https://adaptations-api.uc.r.appspot.com/oauth";
const REDIRECT_URI = "http://localhost:8080/oauth";
const client = new OAuth2Client(CLIENT_ID);

app.use(express.static(__dirname));

async function getAndSaveState() {
  var key = datastore.key(STATE);
  // adapted from https://medium.com/@dazcyril/generating-cryptographic-random-state-in-javascript-in-the-browser-c538b3daae50
  const validChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let array = new Uint8Array(40);
  crypto.getRandomValues(array);
  array = array.map((x) => validChars.charCodeAt(x % validChars.length));
  const secretState = String.fromCharCode.apply(null, array);
  newState = {
    state: secretState,
  };

  // save state in databse
  await datastore.save({ key: key, data: newState });

  return secretState;
}

async function getStatesFromDatabase() {
  const q = datastore.createQuery(STATE);
  const entities = await datastore.runQuery(q);
  return entities[0].map(ds.fromDatastore);
}

async function validateStates(state) {
  const states = await getStatesFromDatabase;
  for (var i = 0; i < states.length; i++) {
    console.log(states[i]);
    if (states[i] === state) {
      return true;
    }
  }
  return false;
}

async function save_user(payload) {
  var key = datastore.key(USER);
  const new_user = {
    name: payload["name"],
    user_sub: payload["sub"],
  };
  const users = await get_users();
  // check if user already exists in database
  for (var i = 0; i < users.length; i++) {
    if (users[i].user_sub === payload["sub"]) {
      return;
    }
  }
  await datastore.save({ key: key, data: new_user });
  return
}

async function get_users() {
  const q = datastore.createQuery(USER);
  const entities = await datastore.runQuery(q);
  return entities[0].map(ds.fromDatastore);
}

/* ------------- Begin Boat Model Functions ------------- */
async function post_boat(req, payload) {
  var key = datastore.key(BOAT);
  const new_boat = {
    name: req.body.name,
    type: req.body.type,
    length: req.body.length,
    public: req.body.public,
    owner: payload["sub"],
  };
  await datastore.save({ key: key, data: new_boat });
  new_boat.id = key.id;
  new_boat.self = `${req.protocol}://${req.get("host")}${req.baseUrl}/${
    key.id
  }`;
  return new_boat;
}

async function get_boats() {
  const q = datastore.createQuery(BOAT);
  const entities = await datastore.runQuery(q);
  return entities[0].map(ds.fromDatastore);
}

// async function delete_boat(id) {
//   const key = datastore.key([BOAT, parseInt(id, 10)]);
//   const boat = await datastore.get(key);
//   if (boat[0] === undefined || boat[0] === null) {
//     return boat;
//   } else {
//     return datastore.delete(key);
//   }
// }

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/jwt_welcome.html"));
});

app.get("/auth-application", async (req, res) => {
  const secretState = await getAndSaveState();
  const authURL = "https://accounts.google.com/o/oauth2/v2/auth";
  authorizationUrl = `${authURL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=profile&state=${secretState}`;
  res.redirect(307, authorizationUrl);
});

app.get("/oauth", async (req, res) => {
  let state = await req.query.state;
  if (!validateStates(state)) {
    res.status(400).json({
      Error: "Invalid State",
    });
  } else {
    tokenURL = "https://oauth2.googleapis.com/token";
    tokenRequestUrl = `${tokenURL}?code=${req.query.code}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=${REDIRECT_URI}&grant_type=authorization_code`;
    fetch(tokenRequestUrl, {
      // Adding method type
      method: "POST",

      // Adding headers to the request
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      // Converting to JSON
      .then((response) => response.json())

      // Send JWT and User ID
      .then(async function (json) {
        
        // extract info from jwt
        const ticket = await client.verifyIdToken({
          idToken: json.id_token,
          audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // save user in database
        save_user(payload);

        // send html list with jwt and id
        res.setHeader("Content-Type", "text/html");
        res.write(
          `<h2>User Info</h2><ul><li>JWT: ${json.id_token}</li><li>User ID: ${payload["sub"]}</li></ul>`
        );
        res.send();
      });
  }
});

boats.get("/", async function (req, res) {
  var authorization = req.headers["authorization"];
  if (authorization) {
    var items = authorization.split(/[ ]+/);

    if (items.length > 1 && items[0].trim() == "Bearer") {
      var token = items[1];
    }
    // verify token
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      });
      const payload = ticket.getPayload();
      console.log(payload["sub"]);
      get_boats(req).then((boats) => {
        const owned_boats = boats.filter((x) => x.owner === payload["sub"]);
        res.status(200).json(owned_boats);
      });
    } catch (e) {
      get_boats(req).then((boats) => {
        const public_boats = boats.filter((x) => x.public === true);
        res.status(200).json(public_boats);
      });
    }
  } else {
    get_boats(req).then((boats) => {
      const public_boats = boats.filter((x) => x.public === true);
      res.status(200).json(public_boats);
    });
  }
});

owners.get("/:owner_id/boats", function (req, res) {
  get_boats(req).then((boats) => {
    const public_boats = boats.filter((x) => x.public === true);
    const owned_boats = public_boats.filter(
      (x) => x.owner === req.params.owner_id
    );
    res.status(200).json(owned_boats);
  });
});

boats.post("/", async function (req, res, next) {
  // Request must be JSON.
  if (req.get("content-type") !== "application/json") {
    res
      .status(415)
      .json({ Error: "Server only accepts application/json data." })
      .end();
  } else {
    var authorization = req.headers["authorization"];
    if (authorization) {
      var items = authorization.split(/[ ]+/);

      if (items.length > 1 && items[0].trim() == "Bearer") {
        var token = items[1];
      }
      // verify token
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
          // Or, if multiple clients access the backend:
          //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        console.log(payload["sub"]);
        // Response must be JSON.
        post_boat(req, payload).then((new_boat) => {
          res.status(201).json(new_boat).end();
        });
      } catch (e) {
        res.status(401).json(`${e}`);
      }
    } else {
      res
        .status(401)
        .json({ Error: "You must be logged in to add a Boat" })
        .end();
    }
  }
});

boats.delete("/:boat_id", async function (req, res) {
  var authorization = req.headers["authorization"];
  if (authorization) {
    var items = authorization.split(/[ ]+/);

    if (items.length > 1 && items[0].trim() == "Bearer") {
      var token = items[1];
    }
    // verify token
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
      });
      const payload = ticket.getPayload();
      userid = payload["sub"];
      const key = datastore.key([BOAT, parseInt(req.params.boat_id, 10)]);
      const boat = await datastore.get(key);
      console.log(boat);
      if (
        boat[0] === undefined ||
        boat[0] === null ||
        boat[0].owner !== userid
      ) {
        res.status(403).json({
          Error:
            "No boat with this boat_id exists or you are not owner of this boat",
        });
      } else {
        datastore.delete(key);
        res.status(204).end();
      }
    } catch (e) {
      res.status(401).json(`${e}`);
    }
  } else {
    res
      .status(401)
      .json({ Error: "You must be logged in to delete a Boat" })
      .end();
  }
});

boats.delete("/", function (req, res) {
  res.set("Accept", "GET, POST");
  res.status(405).json({ Error: "Method Not Allowed" }).end();
});

/* ------------- End Controller Functions ------------- */

app.use("/boats", boats);
app.use("/owners", owners);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
