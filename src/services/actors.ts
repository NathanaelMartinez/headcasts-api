import { Request } from "express";
import { db, fromDatastore } from "../../datastore";
import axios from "axios";

const ACTOR = "Actor";

interface actor {
  name: string;
  imageUrl: string;
  id?: string;
  profileUrl: string;
}

async function searchActorByName(req: Request, actors: actor[]) {
  let actor = actors?.filter(function (item: actor) {
    return item.name === req.query.name;
  });

  // actor doesn't exist in db. make call to TMDB and add to db
  if (!actor[0]) {
    const url = `https://api.themoviedb.org/3/search/person?api_key=${process.env.API_KEY}&language=en-US&query=${req.query.name}&page=1&include_adult=false`;
    await axios
      .get(url)
      .then(async (response) => {
        const fetchedActor = response.data.results[0];
        let actor: actor = {
          name: fetchedActor.name,
          imageUrl: `https://image.tmdb.org/t/p/w185${fetchedActor.profile_path}`,
          profileUrl: `https://www.themoviedb.org/person/${fetchedActor.id}`,
        };
        await postActor(actor);
        return actor;
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    return actor[0];
  }
}

async function getAllActors(req: Request) {
  let q = db.createQuery(ACTOR);

  const entities = await db.runQuery(q);
  const actors: actor[] = entities[0].map(fromDatastore);
  return actors;
}

async function postActor(actor: actor) {
  var key = db.key(ACTOR);

  await db.save({ key: key, data: actor });
  return actor;
}

export { postActor, searchActorByName, getAllActors };
