import {
  fetchAllHeadcasts,
  fetchHeadcast,
  createHeadcast,
  removeHeadcast,
  editHeadcast,
  addActor,
} from "../controllers/headcasts";
import bodyParser from "body-parser";
const router = require("express").Router();
router.use(bodyParser.json());

router.get("/", fetchAllHeadcasts);
router.post("/", createHeadcast);
router.get("/:id", fetchHeadcast);
router.patch("/:id", editHeadcast);
router.delete("/:id", removeHeadcast);
router.put("/:headcast_id/actors/:actor_id", addActor);

module.exports = router;
