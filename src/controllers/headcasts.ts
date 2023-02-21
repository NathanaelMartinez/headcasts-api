import { Request, Response } from "express";
import {
  getHeadcast,
  getAllHeadcasts,
  postHeadcast,
  deleteHeadcast,
  patchHeadcast,
  putActorinActors,
} from "../services/headcasts";
import { searchActorByName } from "../services/actors";

const fetchHeadcast = async (req: Request, res: Response) => {
  try {
    const accepts = req.accepts("application/json");
    if (!accepts) {
      res.status(406).json({ Error: "Not Acceptable" });
    } else if (accepts === "application/json") {
      const host: string = req.get("host")!;
      const headcast = await getHeadcast(req);
      if (headcast[0] === undefined || headcast[0] === null) {
        res
          .status(404)
          .json({ Error: "No headcast with this headcast_id exists" })
          .end();
        // } else if (headcast[0].creator !== payload["sub"]) {
        //   res.status(403).json({
        //     Error: "Access denied: user not the creator of this headcast",
        //   });
      } else {
        res.status(200).json(headcast[0]).end();
      }
    } else {
      res.status(500).json({ Error: "Unable to process request" });
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

const fetchAllHeadcasts = async (req: Request, res: Response) => {
  try {
    const accepts = req.accepts("application/json");
    if (!accepts) {
      res.status(406).json({ Error: "Not Acceptable" });
    } else if (accepts === "application/json") {
      const headcasts = await getAllHeadcasts(req);
      res.status(200).json(headcasts);
    } else {
      res.status(500).json({ Error: "Unable to process request" });
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

const createHeadcast = async (req: Request, res: Response) => {
  // Request must be JSON.
  if (req.get("content-type") !== "application/json") {
    res
      .status(415)
      .json({ Error: "Server only accepts application/json data." })
      .end();
  } else {
    try {
      const accepts = req.accepts("application/json");
      if (!accepts) {
        res.status(406).json({ Error: "Not Acceptable" });
      } else if (accepts === "application/json") {
        if (!req.body.title) {
          res.status(400).json({
            Error: "The heacast must have a valid title",
          });
        } else {
          const newHeadcast = await postHeadcast(req);
          res.status(201).json(newHeadcast).end();
        }
      } else {
        res.status(500).json({ Error: "Unable to process request" });
      }
    } catch (e) {
      res.status(401).json(`${e}`);
    }
  }
};

const removeHeadcast = async (req: Request, res: Response) => {
  try {
    const host: string = req.get("host")!;
    const headcast = await getHeadcast(req);
    if (headcast[0] === null || headcast[0] === undefined) {
      res
        .status(404)
        .json({ Error: "No headcast with this headcast_id exists" })
        .end();
    } else {
      await deleteHeadcast(req);
      res.status(204).end();
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

const editHeadcast = async (req: Request, res: Response) => {
  try {
    const accepts = req.accepts("application/json");
    if (!accepts) {
      res.status(406).json({ Error: "Not Acceptable" });
    } else if (accepts === "application/json") {
      const headcast = await getHeadcast(req);
      if (!headcast || headcast === undefined) {
        res
          .status(404)
          .json({ Error: "No headcast with this headcast_id exists" })
          .end();
        // verify ownership
        // } else if (headcast[0].creator !== payload["sub"]) {
        //   res.status(403).json({
        //     Error: "Access denied: you are the not creator of this headcast",
        //   });
      } else if (
        (req.body.title === undefined || req.body.title === null) &&
        (req.body.director === undefined || req.body.director === null)
      ) {
        res
          .status(400)
          .json({
            Error:
              "The request object is missing one of the attributes to be edited",
          })
          .end();
      } else {
        const editedHeadcast = await patchHeadcast(req);
        res.status(200).json(editedHeadcast).end();
      }
    } else {
      res.status(500).json({ Error: "Unable to process request" });
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

const addActor = async (req: Request, res: Response) => {
  try {
    const accepts = req.accepts("application/json");
    if (!accepts) {
      res.status(406).json({ Error: "Not Acceptable" });
    } else if (accepts === "application/json") {
      const headcastAddedActor = await putActorinActors(req);
      res.status(200).json(headcastAddedActor).end();
    } else {
      res.status(500).json({ Error: "Unable to process request" });
    }
  } catch (e) {
    res.status(401).json(`${e}`);
  }
};

export {
  fetchHeadcast,
  fetchAllHeadcasts,
  createHeadcast,
  editHeadcast,
  removeHeadcast,
  addActor,
};
