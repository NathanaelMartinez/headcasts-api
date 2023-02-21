import { Request, Response } from "express";
import {
  getAllActors,
  searchActorByName,
} from "../services/actors";

const fetchActors = async (req: Request, res: Response) => {
  try {
    const accepts = req.accepts("application/json");
    if (!accepts) {
      res.status(406).json({ Error: "Not Acceptable" });
    } else if (accepts === "application/json") {
      const actors = await getAllActors(req);

      // search specific actor
      if (req.query.name) {
        const namedActor = await searchActorByName(req, actors);
        res.status(200).json(namedActor).end();
      } else {
        // return all actors
        res.status(200).json(actors).end();
      }      
    } else {
      res.status(500).json({ Error: "Unable to process request" });
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

export {
  fetchActors,
};
