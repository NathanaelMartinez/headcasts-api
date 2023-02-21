import { Request, RequestHandler } from "express";
import { db, Datastore, fromDatastore } from "../../datastore";
import { postActor, getAllActors } from "./actors";

const HEADCAST = "Headcast";
const ACTOR = "Actor";

async function getHeadcast(req: Request) {
  const key = db.key([HEADCAST, parseInt(req.params.id, 10)]);
  const entity = await db.get(key);
  if (entity[0] === undefined || entity[0] === null) {
    return entity;
  } else {
    const headcast = entity.map(fromDatastore);
    headcast[0].self = `${req.protocol}://${req.hostname}${req.baseUrl}/${req.params.id}`;
    return headcast;
  }
}

async function postHeadcast(req: Request) {
  var key = db.key(HEADCAST);

  interface actor {
    name: string;
    character: string;
    imageUrl: string;
  }
  const actors: actor[] = [];

  interface headcast {
    title: string;
    director: string;
    actors: actor[];
    id?: string;
    self?: string;
  }

  const headcast: headcast = {
    title: req.body.title,
    director: req.body.director,
    actors,
    // creator: payload["sub"],
  };

  await db.save({ key: key, data: headcast });
  headcast.id = key.id;
  headcast.self = `${req.protocol}://${req.hostname}${req.baseUrl}/${key.id}`;
  return headcast;
}

async function getAllHeadcasts(req: Request) {
  let q = db.createQuery(HEADCAST).limit(30);
  let totalQ = db.createQuery(HEADCAST);

  interface actor {
    name: string;
    character: string;
    imageUrl: string;
  }

  interface headcast {
    title: string;
    director: string;
    actors: actor[];
    id?: string;
    self?: string;
  }

  interface headcastResults {
    headcasts?: headcast[];
    total?: number;
  }

  const headcastResults: headcastResults = {};

  const entities = await db.runQuery(q);
  const totalEntities = await db.runQuery(totalQ);
  const totalHeadcasts = totalEntities[0].map(fromDatastore);
  headcastResults.headcasts = entities[0].map(fromDatastore);
  headcastResults.total = totalHeadcasts.length;
  return headcastResults;
}

async function patchHeadcast(req: Request) {
  const key = db.key([HEADCAST, parseInt(req.params.id, 10)]);
  const headcast = await getHeadcast(req);
  if (req.body.title !== null && req.body.title !== undefined) {
    headcast[0].title = req.body.title;
  }
  if (req.body.director !== null && req.body.director !== undefined) {
    headcast[0].director = req.body.director;
  }
  await db.save({ key: key, data: headcast[0] });
  headcast[0].id = key.id;
  headcast[0].self = `${req.protocol}://${req.get("host")}${req.baseUrl}/${
    key.id
  }`;
  return headcast[0];
}

async function deleteHeadcast(req: Request) {
  const key = db.key([HEADCAST, parseInt(req.params.id, 10)]);
  const headcast = await db.get(key);
  if (headcast[0] === undefined || headcast[0] === null) {
    return headcast;
  } else {
    return db.delete(key);
  }
}

async function putActorinActors(req: Request) {
  const headcast_key = db.key([HEADCAST, parseInt(req.params.headcast_id, 10)]);
  const headcast = await db.get(headcast_key);

  const addedActor = `{
    "id": "${req.params.actor_id}", 
    "self": "${req.protocol}://${req.get("host")}/actors/${req.params.actor_id}",
    "character": "${req.body.role}"
  }`;

  headcast[0].actors.push(JSON.parse(addedActor));
  await db.save({ key: headcast_key, data: headcast[0] });

  return headcast[0];
}

async function removeActorFromActors(req: Request) {
  const headcast_key = db.key([HEADCAST, parseInt(req.params.boat_id, 10)]);
  const actor_key = db.key([ACTOR, parseInt(req.params.load_id, 10)]);
  const headcast = await db.get(headcast_key);
  const actor = await db.get(actor_key);
  
  // find load and remove
  let actors = headcast[0].actors;

  interface actor {
    name: string;
    character: string;
    imageUrl: string;
    id: string;
  }

  actors = actors.filter(function (actor: actor) {
    return actor.id !== 
  });
  load[0].carrier = null;
  boat[0].loads = boat_loads;
  await datastore.save({ key: boat_key, data: boat[0] });
  await datastore.save({ key: load_key, data: load[0] });

  return true;
}

export {
  deleteHeadcast,
  patchHeadcast,
  postHeadcast,
  getHeadcast,
  getAllHeadcasts,
  putActorinActors
};
