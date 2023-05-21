const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra')
const formidable = require('formidable');
const { URLSearchParams } = require('url');

const app = express();
const port = 5500;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ defaultLayout: 'main.hbs' }));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

app.get('/', (req, res) => {
  const newRoute = req.query.newRoute || '/';
  const routesArray = handleRoute(newRoute);
  const activeUploadsPath = path.join(uploadsPath, newRoute);
  const dirContents = readDirectoryContents(activeUploadsPath)
  const canRename = newRoute === "/" ? false : true

  /*
  Render options are:
    contents - folders and files data,
    routesArray - informations about the current path,
    currentRoute - string with the current route in uploads folder
  */

  res.render('index.hbs', {
    contents: dirContents,
    routesArray: routesArray,
    currentRoute: newRoute,
    canRename
  });
});

app.post('/', (req, res) => {
  let currentRoute = req.body.newRoute || "/" //used for file/folder creation and upload

  if (req.body.reqType === 'folder') {
    var newPath = path.join(uploadsPath, currentRoute, req.body.entityName);
    var i = 0;
    while (fs.existsSync(newPath)) {
      i += 1;
      if (newPath.at(-3) == '(' && newPath.at(-1) == ')') {
        newPath = newPath.substring(0, newPath.length - 3) + `(${i})`;
      } else {
        newPath += `(${i})`;
      }
    }
    fs.mkdirSync(newPath);
  } else if (req.body.reqType === 'file') {
    var fileName = req.body.entityName;
    var fileExt = undefined;

    //check if file extension provided
    if (fileName.lastIndexOf('.') != -1) {
      fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
      fileName = fileName.substring(0, fileName.lastIndexOf('.'));
    } else {
      fileExt = 'txt';
    }

    var newPath = path.join(uploadsPath, currentRoute, fileName + '.' + fileExt);
    var i = 0;

    while (fs.existsSync(newPath)) {
      i += 1;
      if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
        newPath = path.join(
          uploadsPath, currentRoute,
          fileName.substring(0, fileName.length - 3) + `(${i})` + '.' + fileExt
        );
      } else {
        newPath = path.join(
          uploadsPath, currentRoute,
          fileName + `(${i})` + '.' + fileExt
        );
      }
    }

    fs.writeFileSync(newPath, '');
    // return res.render('index.hbs', {
    //   contents: readDirectoryContents(uploadsPath),
    // });
  } else if (req.body.reqType === 'remove') {
    const fileName = req.body.entityName;
    const newPath = path.join(uploadsPath, currentRoute, fileName);

    if (fs.existsSync(newPath)) {
      if (fs.lstatSync(newPath).isDirectory()) {
        fse.removeSync(newPath);
      } else {
        fs.unlinkSync(newPath);
      }
    }

    // return res.render('index.hbs', {
    //   contents: readDirectoryContents(uploadsPath),
    // });
  } else if (req.body.reqType === 'renameFolder') {
    var oldPath = path.join(uploadsPath, currentRoute);
    var newPath = path.join(oldPath, "../", req.body.newName)

    if (!fs.existsSync(newPath)) fs.mkdirSync(newPath);
    let contents = readDirectoryContents(oldPath)
    renameDirectoryContents(contents, oldPath, newPath)
    if (fs.existsSync(oldPath)) fse.removeSync(oldPath);

    currentRoute = path.join(currentRoute, "..", req.body.newName) + "/"
    currentRoute = currentRoute.replaceAll("\\", "/")
  } else {
    let form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: uploadsPath,
    });

    form.parse(req, (err, fields, files) => {
      currentRoute = fields.newRoute || "/"
      if (files.entities.length > 1) {
        files.entities.forEach((file) => {
          var newPath = path.join(uploadsPath, currentRoute, file.originalFilename);
          var fileName = file.originalFilename.substring(
            0,
            file.originalFilename.lastIndexOf('.')
          );
          var fileExt = file.originalFilename.substring(file.originalFilename.lastIndexOf('.') + 1);
          var i = 0;

          while (fs.existsSync(newPath)) {
            i += 1;
            if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
              newPath = path.join(
                uploadsPath, currentRoute,
                fileName.substring(0, fileName.length - 3) +
                `(${i})` +
                '.' +
                fileExt
              );
            } else {
              newPath = path.join(
                uploadsPath, currentRoute,
                fileName + `(${i})` + '.' + fileExt
              );
            }
          }

          fs.renameSync(file.filepath, newPath);
        });
      } else {
        var newPath = path.join(
          uploadsPath, currentRoute,
          files.entities.originalFilename
        );
        var fileName = files.entities.originalFilename.substring(
          0,
          files.entities.originalFilename.lastIndexOf('.')
        );
        var fileExt = files.entities.originalFilename.substring(files.entities.originalFilename.lastIndexOf('.') + 1);
        var i = 0;

        while (fs.existsSync(newPath)) {
          i += 1;
          if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
            newPath = path.join(
              uploadsPath, currentRoute,
              fileName.substring(0, fileName.length - 3) +
              `(${i})` +
              '.' +
              fileExt
            );
          } else {
            newPath = path.join(
              uploadsPath, currentRoute,
              fileName + `(${i})` + '.' + fileExt
            );
          }
        }

        fs.renameSync(files.entities.filepath, newPath);
      }

      // return res.render('index.hbs', {
      //   contents: readDirectoryContents(uploadsPath),
      // });
      const queryParameters = {
        newRoute: currentRoute
      }
      const queryString = new URLSearchParams(queryParameters)
      return res.redirect(`/?${queryString}`)
    });
  }

  if (["folder", "file", "remove", "renameFolder"].includes(req.body.reqType)) {
    const queryParameters = {
      newRoute: currentRoute
    }
    const queryString = new URLSearchParams(queryParameters)
    return res.redirect(`/?${queryString}`)
  }

});

app.get('*', (req, res) => {
  res.render('404.hbs', { url: req.url });
});

function renameDirectoryContents(contents, oldPath, newPath) {
  if (contents.files)
    contents.files.forEach(file => {
      fs.renameSync(path.join(oldPath, file.name + file.ext), path.join(newPath, file.name + file.ext))
    })

  if (contents.folders)
    contents.folders.forEach(folder => {
      const oldFolderPath = path.join(oldPath, folder)
      const newFolderPath = path.join(newPath, folder)
      try { fs.mkdirSync(newFolderPath) }
      catch (err) { console.error(err) }
      const newFolderContents = readDirectoryContents(oldFolderPath)
      if (newFolderContents.files.length != 0 || newFolderContents.folders.length != 0) {
        renameDirectoryContents(newFolderContents, oldFolderPath, newFolderPath)
      }
      fse.removeSync(oldFolderPath)
    })
}

//New route parameter is the relative path from uploads/ folder
//Not just the new folder name but the whole thing
function handleRoute(newRoute) {
  const namePathArray = []
  if (newRoute === "/") return namePathArray

  //trimming "/"
  if (newRoute.at(0) === "/") newRoute = newRoute.slice(1)
  if (newRoute.at(newRoute.length - 1) === "/") newRoute = newRoute.slice(0, -1)

  let pathTracker = "/"
  newRoute.split("/").forEach((el, i) => {
    pathTracker += `${el}/`
    namePathArray.push({
      name: el, path: pathTracker
    })
  })

  //Make an array from the newRoute string and return it
  /* [
    {name: abs, path: /abs},
    {name: ccc, path: /abs/ccc},
  ] */

  return namePathArray;
}

function readDirectoryContents(path) {
  const contents = { files: [], folders: [] };
  fs.readdirSync(path, { withFileTypes: true }).forEach((e) => {
    if (e.isDirectory()) {
      contents.folders.push(e.name);
    } else {
      //is file
      contents.files.push({
        name: e.name.substring(0, e.name.lastIndexOf('.')),
        ext: e.name.substring(e.name.lastIndexOf('.')),
      });
    }
  });
  return contents;
}

app.listen(port, () => {
  console.log(`Server listening on localhost:${port}`);
});
