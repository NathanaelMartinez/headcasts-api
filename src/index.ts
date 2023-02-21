require('dotenv').config()

import express from "express";
import bodyParser from "body-parser";
const app = express();
app.use(bodyParser.json());
app.use("/api/headcasts", require("./routes/headcasts"));
app.use("/api/actors", require("./routes/actors"));
export default app;
