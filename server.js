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

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(uploadsPath);
}

app.get("/", (req, res) => {
  res.render("index.hbs");
});

app.post("/", (req, res) => {
  console.log(req.body);
  if (req.body.reqType === "folder") {
    console.log("is folder");
    var newPath = path.join(uploadsPath, req.body.entityName);
    var i = 0;
    while (fs.existsSync(newPath)) {
      i += 1;
      if (newPath.at(-3) == "(" && newPath.at(-1) == ")") {
        if (newPath.substring(newPath.length, -3) !== `(${i})`)
          newPath += `(${i})`;
        break;
      } else {
        newPath += `(${i})`;
        break;
      }
    }
    fs.mkdirSync(newPath);
  }

  res.render("index.hbs");
});

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
