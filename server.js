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
    return res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });
  } else if (req.body.reqType === "file") {
    var fileName = req.body.entityName
    var fileExt = undefined
    var newPath = path.join(__dirname, req.body.entityName)

    //check if file extension provided
    if (fileName.lastIndexOf(".") != -1) {
      fileExt = fileName.substring(fileName.lastIndexOf(".") + 1)
      fileName = fileName.substring(0, fileName.lastIndexOf("."))
    } else {
      fileExt = "txt"
    }

    var newPath = path.join(uploadsPath, fileName + "." + fileExt);
    var i = 0;

    while (fs.existsSync(newPath)) {
      console.log(newPath);
      i += 1;
      if (fileName.at(-3) == "(" && fileName.at(-1) == ")") {
        newPath = path.join(uploadsPath, fileName.substring(0, fileName.length - 3)
          + `(${i})`
          + "." + fileExt);
      } else {
        newPath = path.join(uploadsPath, fileName
          + `(${i})`
          + "." + fileExt);
      }
    }

    fs.writeFileSync(newPath, "")
    return res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });

  } else if (req.body.reqType === "remove") {

    const fileName = req.body.entityName
    const newPath = path.join(uploadsPath, fileName)

    if (fs.existsSync(newPath)) {
      if (fs.lstatSync(newPath).isDirectory()) {
        fs.rmdirSync(newPath)
      } else {
        fs.unlinkSync(newPath)
      }
    }

    return res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });

  } else {
    let form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: uploadsPath
    })

    form.parse(req, (err, fields, files) => {
      if (files.entities.length > 1) {
        files.entities.forEach(file => {
          var newPath = path.join(uploadsPath, file.originalFilename)
          var fileName = file.originalFilename.substring(0, file.originalFilename.lastIndexOf("."))
          var fileExt = fileName.substring(fileName.lastIndexOf(".") + 1)
          var i = 0

          while (fs.existsSync(newPath)) {
            i += 1;
            if (fileName.at(-3) == "(" && fileName.at(-1) == ")") {
              newPath = path.join(uploadsPath, fileName.substring(0, fileName.length - 3)
                + `(${i})`
                + "." + fileExt);
            } else {
              newPath = path.join(uploadsPath, fileName
                + `(${i})`
                + "." + fileExt);
            }
          }

          fs.renameSync(file.filepath, newPath)
        })
      } else {
        var newPath = path.join(uploadsPath, files.entities.originalFilename)
        var fileName = files.entities.originalFilename.substring(0, files.entities.originalFilename.lastIndexOf("."))
        var fileExt = fileName.substring(fileName.lastIndexOf(".") + 1)
        var i = 0

        while (fs.existsSync(newPath)) {
          i += 1;
          if (fileName.at(-3) == "(" && fileName.at(-1) == ")") {
            newPath = path.join(uploadsPath, fileName.substring(0, fileName.length - 3)
              + `(${i})`
              + "." + fileExt);
          } else {
            newPath = path.join(uploadsPath, fileName
              + `(${i})`
              + "." + fileExt);
          }
        }

        fs.renameSync(files.entities.filepath, newPath)
      }

      return res.render("index.hbs", { contents: readDirectoryContents(uploadsPath) });
    })
  }
});


function readDirectoryContents(path) {
  const contents = { files: [], folders: [] }
  fs.readdirSync(path, { withFileTypes: true }).forEach((e) => {
    if (e.isDirectory()) {
      contents.folders.push(e.name)
    } else {
      contents.files.push({
        name: e.name.substring(0, e.name.lastIndexOf(".")),
        ext: e.name.substring(e.name.lastIndexOf("."))
      })
    }
  })
  return contents
}

app.listen(port, () => {
  console.log(`Server listening on localhost:${port}`);
});
