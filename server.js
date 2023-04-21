const express = require("express");
const hbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5500;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine("hbs", hbs.engine({ defaultLayout: "main.hbs" }));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.get("/", (req, res) => {
  res.render("index.hbs");
});

app.post("/", (req, res) => {
  console.log(req.body);
  if (req.body.type === "folder") {
  }

  res.render("index.hbs");
});

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
