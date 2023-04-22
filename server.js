const express = require("express");
const hbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const formidable = require('formidable')

const app = express();
const port = 5500;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine("hbs", hbs.engine({ defaultLayout: "main.hbs" }));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(path.join(uploadsPath))) {
  fs.mkdirSync(uploadsPath);
}

app.get("/", (req, res) => {
  res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });
});

app.post("/", (req, res) => {
  console.log(req.body);
  if (req.body.reqType === "folder") {
    var newPath = path.join(uploadsPath, req.body.entityName);
    var i = 0;
    while (fs.existsSync(newPath)) {
      i += 1;
      if (newPath.at(-3) == "(" && newPath.at(-1) == ")") {
        newPath = newPath.substring(0, newPath.length - 3) + `(${i})`;
      } else {
        newPath += `(${i})`;
      }
    }
    fs.mkdirSync(newPath);
  } else if (req.body.reqType === "file") {
    var fileName = req.body.entityName
    var fileExt = undefined
    var newPath = path.join(__dirname, req.body.entityName)

    //check if file extension provided
    if (fileName.lastIndexOf(".") != -1) {
      fileExt = fileName.substring(fileName.lastIndexOf(".") + 1)
      fileName = fileName.substring(0, fileName.lastIndexOf("."))
    }

    var newPath = path.join(uploadsPath, fileName);
    var i = 0;
    while (fs.existsSync(newPath)) {
      i += 1;
      if (newPath.at(-3) == "(" && newPath.at(-1) == ")") {
        newPath = newPath.substring(0, newPath.length - 3) + `(${i})`;
      } else {
        newPath += `(${i})`;
      }
    }

    if (fileExt) { newPath += "." + fileExt }
    else { newPath += ".txt" }

    fs.writeFileSync(newPath, "")
  } else if (req.body.reqType === "remove") {

    const fileName = req.body.entityName
    const newPath = path.join(uploadsPath, fileName)
    console.log(newPath);

    if (fs.existsSync(newPath)) {
      if (fs.lstatSync(newPath).isDirectory()) {
        fs.rmdirSync(newPath)
      } else {
        fs.unlinkSync(newPath)
      }
    }
  } else if (req.body.reqType === "upload") {
    let form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: uploadsPath
    })
    form.parse(req, (err, fields, files) => {
      console.log("----- przesłane pola z formularza ------");
      console.log(fields);
      console.log("----- przesłane formularzem pliki ------");
      console.log(files);
    })
  }

  res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });
});


function readDirectoryContents(path) {
  const contents = { files: [], folders: [] }
  fs.readdirSync(path, { withFileTypes: true }).forEach((e) => {
    if (e.isDirectory()) {
      contents.folders.push(e.name)
    } else {
      contents.files.push(e.name)
    }
  })
  return contents
}

app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
