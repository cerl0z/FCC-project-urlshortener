require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const dns = require("dns");
const { url } = require("inspector");
const URL = require("url").URL;
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }); // Basic Configuration

const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("URL", urlSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.use(bodyParser.urlencoded({ extended: false }));

app.post("/api/shorturl", (req, res, next) => {
  const o_url = req.body.url;
  const s_url = Math.floor(Math.random() * 1000);
  const regex = "^https?://www\\.";

  try {
    const urlObj = new URL(o_url);

    if (!urlObj.toString().match(regex)) {
      res.json({
        error: "invalid url",
      });
    } else {
      dns.lookup(urlObj.hostname, async (err) => {
        let findOne = await Url.findOne({ original_url: o_url });

        if (findOne) {
          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url,
          });
        } else {
          findOne = new Url({
            original_url: o_url,
            short_url: s_url,
          });

          await findOne.save();

          res.json({
            original_url: findOne.original_url,
            short_url: findOne.short_url,
          });
        }
      });
    }
  } catch (err) {
    if (err) {
      res.json({
        error: "invalid url",
      });
    }
  }
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  let s_url = req.params.short_url;
  let findOne = await Url.findOne({ short_url: s_url });
  if (findOne) {
    res.redirect(findOne.original_url);
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
