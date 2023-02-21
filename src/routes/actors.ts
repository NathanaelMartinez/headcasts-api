import {
  fetchActors,
} from "../controllers/actors";
import bodyParser from "body-parser";
const router = require("express").Router();
router.use(bodyParser.json());

router.get("/", fetchActors);

module.exports = router;
