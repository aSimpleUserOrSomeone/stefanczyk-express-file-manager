const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const formidable = require('formidable');

const app = express();
const port = 5500;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs', hbs.engine({ defaultLayout: 'main.hbs' }));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('static'));

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(path.join(uploadsPath))) {
  fs.mkdirSync(uploadsPath);
}
let activeUploadsPath = uploadsPath;

app.get('/', (req, res) => {
  const newRoute = req.query.newRoute || '';
  const currentPath = handleRoute(newRoute);
  let currentPathS = currentPath.map((el) => el.name).join('/');
  if (currentPathS.length) currentPathS += '/';

  res.render('index.hbs', {
    contents: readDirectoryContents(activeUploadsPath),
    currentRoute: currentPath,
    currentRouteS: currentPathS,
  });
});

app.post('/', (req, res) => {
  // console.log(req.body);
  if (req.body.reqType === 'folder') {
    var newPath = path.join(activeUploadsPath, req.body.entityName);
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
    return res.render('index.hbs', {
      contents: readDirectoryContents(activeUploadsPath),
    });
  } else if (req.body.reqType === 'file') {
    var fileName = req.body.entityName;
    var fileExt = undefined;
    var newPath = path.join(__dirname, req.body.entityName);

    //check if file extension provided
    if (fileName.lastIndexOf('.') != -1) {
      fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
      fileName = fileName.substring(0, fileName.lastIndexOf('.'));
    } else {
      fileExt = 'txt';
    }

    var newPath = path.join(activeUploadsPath, fileName + '.' + fileExt);
    var i = 0;

    while (fs.existsSync(newPath)) {
      console.log(newPath);
      i += 1;
      if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
        newPath = path.join(
          activeUploadsPath,
          fileName.substring(0, fileName.length - 3) + `(${i})` + '.' + fileExt
        );
      } else {
        newPath = path.join(
          activeUploadsPath,
          fileName + `(${i})` + '.' + fileExt
        );
      }
    }

    fs.writeFileSync(newPath, '');
    return res.render('index.hbs', {
      contents: readDirectoryContents(activeUploadsPath),
    });
  } else if (req.body.reqType === 'remove') {
    console.log(req.body.entityName);

    const fileName = req.body.entityName;
    const newPath = path.join(activeUploadsPath, fileName);

    if (fs.existsSync(newPath)) {
      if (fs.lstatSync(newPath).isDirectory()) {
        fs.rmdirSync(newPath);
      } else {
        fs.unlinkSync(newPath);
      }
    }

    return res.render('index.hbs', {
      contents: readDirectoryContents(activeUploadsPath),
    });
  } else {
    let form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: activeUploadsPath,
    });

    form.parse(req, (err, fields, files) => {
      if (files.entities.length > 1) {
        files.entities.forEach((file) => {
          var newPath = path.join(activeUploadsPath, file.originalFilename);
          var fileName = file.originalFilename.substring(
            0,
            file.originalFilename.lastIndexOf('.')
          );
          var fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
          var i = 0;

          while (fs.existsSync(newPath)) {
            i += 1;
            if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
              newPath = path.join(
                activeUploadsPath,
                fileName.substring(0, fileName.length - 3) +
                  `(${i})` +
                  '.' +
                  fileExt
              );
            } else {
              newPath = path.join(
                activeUploadsPath,
                fileName + `(${i})` + '.' + fileExt
              );
            }
          }

          fs.renameSync(file.filepath, newPath);
        });
      } else {
        var newPath = path.join(
          activeUploadsPath,
          files.entities.originalFilename
        );
        var fileName = files.entities.originalFilename.substring(
          0,
          files.entities.originalFilename.lastIndexOf('.')
        );
        var fileExt = fileName.substring(fileName.lastIndexOf('.') + 1);
        var i = 0;

        while (fs.existsSync(newPath)) {
          i += 1;
          if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
            newPath = path.join(
              activeUploadsPath,
              fileName.substring(0, fileName.length - 3) +
                `(${i})` +
                '.' +
                fileExt
            );
          } else {
            newPath = path.join(
              activeUploadsPath,
              fileName + `(${i})` + '.' + fileExt
            );
          }
        }

        fs.renameSync(files.entities.filepath, newPath);
      }

      return res.render('index.hbs', {
        contents: readDirectoryContents(activeUploadsPath),
      });
    });
  }
});

app.get('*', (req, res) => {
  console.log('error!');
  res.render('404.hbs', { url: req.url });
});

let currentPath = [];
//New route parameter is the relative path from upload/ folder
//Not just the new folder name but the whole
function handleRoute(newRoute) {
  if (newRoute == '/') {
    activeUploadsPath = uploadsPath;
    sustainedPath = '';
    currentPath = [];
    console.log('Route is home!');
  } else if (path.join(uploadsPath, newRoute) == activeUploadsPath) {
    console.log('Route stayed the same:');
    console.log(newRoute);
  } else if (
    path.join(uploadsPath, newRoute).length < activeUploadsPath.length
  ) {
    console.log('Route reversed to:');
    console.log(newRoute);
    activeUploadsPath = path.join(uploadsPath, newRoute);
  } else {
    console.log('Route changed to:');
    console.log(newRoute);
    activeUploadsPath = path.join(uploadsPath, newRoute);
    //
    const newRouteName =
      newRoute.lastIndexOf('/') == -1
        ? newRoute
        : newRoute.slice(newRoute.lastIndexOf('/') + 1);
    currentPath.push({ name: newRouteName, absoluteRoute: newRoute });
  }

  return currentPath;
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
