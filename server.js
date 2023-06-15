const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { URLSearchParams } = require('url');
const colors = require('colors')

const express = require('express');
const hbs = require('express-handlebars');
const formidable = require('formidable');
const cors = require('cors');
const nocache = require("nocache");
const cookieParser = require('cookie-parser');

const connectDB = require("./mongo")
const userSchema = require("./schemas/user-schemas")

connectDB()
const app = express();
const port = 5500;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine(
  'hbs',
  hbs.engine({
    defaultLayout: 'main.hbs',
    helpers: {
      ifTextExt: function (ext, options) {
        const exts = ['.html', '.css', '.json', '.js', '.xml', '.txt'];
        if (exts.includes(ext)) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      ifPhotoExt: function (ext, options) {
        const exts = ['.jpg', '.jpeg', '.png'];
        if (exts.includes(ext)) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    },
  })
);

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('static'));
app.use(cors({ origin: '*' })
);
app.use(cookieParser());
app.use(express.json({ limit: '5mb' }));
// app.use(nocache())

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}


async function existsUser(username, password) {
  //check with database for existing username
  if (!password) {
    const users = await userSchema.find({ username })
    if (users.length) {
      return true;
    }
    return false
  }
  //check with database for correct login data
  const users = await userSchema.find({ username, password })
  if (users.length) {
    return true;
  }
  return false
}

const addUser = async (username, password) => {
  if (!username || !password) return false
  try {
    userSchema.create({ username, password })
  } catch (err) {
    console.log(`Error: ${err}`.bgRed);
  }
}

fs.writeFileSync('./file-preferences.json', '[]');

const checkCredentials = async (req, res, next) => {
  const cookieUser = req.cookies.username;
  const cookiePass = req.cookies.password;
  const isValid = await existsUser(cookieUser, cookiePass)

  if (!cookieUser || !cookiePass || !isValid) {
    //invalid login data, redirect to login page
    res.clearCookie("username")
    res.clearCookie("password")
    return res.render("login.hbs", { isReason: true, reason: "Invalid user data" })
  }
  //user is valid and can access the desired page

  next();
};

app.get('/', checkCredentials, (req, res) => {
  const newRoute = req.query.newRoute || '/';
  const routesArray = handleRoute(newRoute);
  const activeUploadsPath = path.join(uploadsPath, newRoute);
  const dirContents = readDirectoryContents(activeUploadsPath);
  const canRename = newRoute === '/' ? false : true;

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
    canRename,
  });
});

app.get("/login", (req, res) => {
  res.render("login.hbs")
})
app.post("/login", (req, res) => {
  const formUser = req.body.username
  const formPass = req.body.password

  const cookieOptions = { expires: new Date(Date.now() + 300000), httpOnly: true, sameSite: "Strict" }
  existsUser(formUser, formPass).then(isValid => {
    if (isValid) {
      res.cookie("username", formUser, cookieOptions)
      res.cookie("password", formPass, cookieOptions)
      return res.redirect("/")
    } else {
      return res.render('login.hbs', { isReason: true, reason: "Invalid user data" })
    }
  })
})

app.get("/logout", (req, res) => {
  res.clearCookie("username")
  res.clearCookie("password")

  res.redirect("/login")
})

app.get("/register", (req, res) => {
  res.render("register.hbs")
})
app.post("/register", async (req, res) => {
  const formUser = req.body.username
  const formPass = req.body.password

  const cookieOptions = { expires: new Date(Date.now() + 300000), httpOnly: true, sameSite: "Strict" }
  existsUser(formUser).then(isUser => {
    if (!isUser) {
      res.cookie("username", formUser, cookieOptions)
      res.cookie("password", formPass, cookieOptions)
      addUser(formUser, formPass)
      return res.redirect("/")
    } else {
      return res.render('register.hbs', { isReason: true, reason: "Username already in use" })
    }
  })
})

app.get('/editor', checkCredentials, (req, res) => {
  const newRoute = req.query.newRoute || '/';
  // if (newRoute === "/")
  //   return res.redirect('/')

  const fullPath = path.join(uploadsPath, newRoute);
  const fileName = req.query.fileName;
  const textContent = fs.readFileSync(path.join(fullPath, fileName), 'utf8');

  res.render('editor.hbs', {
    currentRoute: newRoute,
    fileName,
    textContent,
    canRename: false,
  });
});

app.get('/photos', checkCredentials, (req, res) => {
  const fileName = req.query.fileName;
  const newRoute = req.query.newRoute;
  const filters = ['invert', 'sepia', 'grayscale', 'none'];

  res.render('photos.hbs', { filters, currentRoute: newRoute, fileName });
});

app.post('/getPhoto', (req, res) => {
  const photoPath = req.body.photoPath;

  if (!photoPath) {
    console.log(req.body);
    return res.json({ RES: 'WRONGBODY' });
  }

  const ext = ['.jpg', '.jpeg', '.png'];
  const filepath = path.join(uploadsPath, photoPath);
  if (!ext.includes(path.extname(filepath)))
    return res.json({ RES: 'CANTREADPHOTO' });

  let fileEncoded = {
    base64: '',
  };

  if (fs.existsSync(filepath)) {
    fileEncoded = {
      base64: fs.readFileSync(filepath, 'base64'),
    };
  }

  return res.json({ file: fileEncoded });
});

app.post('/photoEdit', (req, res) => {
  const photoPath = req.body.photoPath;
  const dataUrl = req.body.dataUrl;

  if (!photoPath || !dataUrl) return res.json({ ERR: 'WRONGBODY' });

  const photoBuffer = Buffer.from(dataUrl, 'base64');
  fs.writeFileSync(path.join(uploadsPath, photoPath), photoBuffer);
  res.json({ RES: 'OK' });
});

app.use('/photoRename', (req, res, next) => {
  const { oldPath, newPath, filePath, fileName } = req.body;
  if (!oldPath || !newPath || !filePath || !fileName) {
    return res.json({ ERR: 'WRONGBODY' });
  }

  if (fs.existsSync(path.join(uploadsPath, oldPath))) {
    fs.renameSync(
      path.join(uploadsPath, oldPath),
      path.join(uploadsPath, newPath)
    );
  } else {
    return res.json({ ERR: 'NOFILE' });
  }

  const queryParameters = {
    fileName,
    newRoute: filePath,
  };
  const queryString = new URLSearchParams(queryParameters);
  res.redirect(`/photos?${queryString}`);
  next();
});

app.post('/', (req, res) => {
  let currentRoute = req.body.newRoute || '/'; //used for file/folder creation and upload

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

    var newPath = path.join(
      uploadsPath,
      currentRoute,
      fileName + '.' + fileExt
    );
    var i = 0;

    while (fs.existsSync(newPath)) {
      i += 1;
      if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
        newPath = path.join(
          uploadsPath,
          currentRoute,
          fileName.substring(0, fileName.length - 3) + `(${i})` + '.' + fileExt
        );
      } else {
        newPath = path.join(
          uploadsPath,
          currentRoute,
          fileName + `(${i})` + '.' + fileExt
        );
      }
    }

    if (fs.existsSync(path.join(`./templates/${fileExt}-template.txt`))) {
      const templateData = fs.readFileSync(
        `./templates/${fileExt}-template.txt`,
        'utf-8'
      );
      fs.writeFileSync(newPath, templateData);
    } else {
      fs.writeFileSync(newPath, '');
    }
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
    var newPath = path.join(oldPath, '../', req.body.newName);

    if (!fs.existsSync(newPath)) fs.mkdirSync(newPath);
    let contents = readDirectoryContents(oldPath);
    renameDirectoryContents(contents, oldPath, newPath);
    if (fs.existsSync(oldPath)) fse.removeSync(oldPath);

    currentRoute = path.join(currentRoute, '..', req.body.newName) + '/';
    currentRoute = currentRoute.replaceAll('\\', '/');
  } else {
    let form = formidable({
      multiples: true,
      keepExtensions: true,
      uploadDir: uploadsPath,
    });

    form.parse(req, (err, fields, files) => {
      currentRoute = fields.newRoute || '/';
      if (files.entities.length > 1) {
        files.entities.forEach((file) => {
          var newPath = path.join(
            uploadsPath,
            currentRoute,
            file.originalFilename
          );
          var fileName = file.originalFilename.substring(
            0,
            file.originalFilename.lastIndexOf('.')
          );
          var fileExt = file.originalFilename.substring(
            file.originalFilename.lastIndexOf('.') + 1
          );
          var i = 0;

          while (fs.existsSync(newPath)) {
            i += 1;
            if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
              newPath = path.join(
                uploadsPath,
                currentRoute,
                fileName.substring(0, fileName.length - 3) +
                `(${i})` +
                '.' +
                fileExt
              );
            } else {
              newPath = path.join(
                uploadsPath,
                currentRoute,
                fileName + `(${i})` + '.' + fileExt
              );
            }
          }

          fs.renameSync(file.filepath, newPath);
        });
      } else {
        var newPath = path.join(
          uploadsPath,
          currentRoute,
          files.entities.originalFilename
        );
        var fileName = files.entities.originalFilename.substring(
          0,
          files.entities.originalFilename.lastIndexOf('.')
        );
        var fileExt = files.entities.originalFilename.substring(
          files.entities.originalFilename.lastIndexOf('.') + 1
        );
        var i = 0;

        while (fs.existsSync(newPath)) {
          i += 1;
          if (fileName.at(-3) == '(' && fileName.at(-1) == ')') {
            newPath = path.join(
              uploadsPath,
              currentRoute,
              fileName.substring(0, fileName.length - 3) +
              `(${i})` +
              '.' +
              fileExt
            );
          } else {
            newPath = path.join(
              uploadsPath,
              currentRoute,
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
        newRoute: currentRoute,
      };
      const queryString = new URLSearchParams(queryParameters);
      return res.redirect(`/?${queryString}`);
    });
  }

  if (['folder', 'file', 'remove', 'renameFolder'].includes(req.body.reqType)) {
    const queryParameters = {
      newRoute: currentRoute,
    };
    const queryString = new URLSearchParams(queryParameters);
    return res.redirect(`/?${queryString}`);
  }
});

app.post('/preferences', (req, res) => {
  const fileName = req.body.fileName || undefined;

  if (!fileName) return res.json({ ERR: 'NOFILENAME' });

  const prefBuffer = fs.readFileSync('./file-preferences.json');
  const prefJSON = JSON.parse(prefBuffer);

  const fontIndex = req.body.fontIndex;
  const colorTheme = req.body.colorTheme;

  const [nextPrefBuffer] = prefJSON.filter((el) => el.name === fileName);
  let nextPref = {};
  if (!nextPrefBuffer) {
    nextPref = { name: fileName };
  } else {
    nextPref = nextPrefBuffer;
  }

  if (fontIndex !== undefined) nextPref.fontIndex = fontIndex;

  if (colorTheme !== undefined) nextPref.colorTheme = colorTheme;

  const nextPrefJSON = [
    ...prefJSON.filter((el) => el.name !== fileName),
    nextPref,
  ];
  fs.writeFileSync('./file-preferences.json', JSON.stringify(nextPrefJSON));

  res.json(nextPref);
});

app.post('/renameFile', (req, res) => {
  const filePath = req.body.filePath;
  const oldName = req.body.oldName;
  let newName = req.body.newName;

  if (!filePath || !oldName || !newName) {
    return res.json({ RES: 'WRONGBODY' });
  }

  if (newName.lastIndexOf('.') === -1) {
    newName += '.txt';
  }

  const currentPath = path.join(uploadsPath, filePath);

  fs.renameSync(
    path.join(currentPath, oldName),
    path.join(currentPath, newName)
  );

  res.json({ RES: 'OK' });
});

app.post('/editText', (req, res) => {
  const fileName = req.body.fileName;
  const filePath = req.body.filePath;
  const fileContents = req.body.fileContents;

  if (!fileName || !filePath || !fileContents) {
    return res.json({ RES: 'WRONGBODY' });
  }

  const currentPath = path.join(uploadsPath, filePath);
  fs.writeFileSync(path.join(currentPath, fileName), fileContents);

  return res.json({ RES: 'OK' });
});

app.get('*', (req, res) => {
  res.render('404.hbs', { url: req.url });
});

function renameDirectoryContents(contents, oldPath, newPath) {
  if (contents.files)
    contents.files.forEach((file) => {
      fs.renameSync(
        path.join(oldPath, file.name + file.ext),
        path.join(newPath, file.name + file.ext)
      );
    });

  if (contents.folders)
    contents.folders.forEach((folder) => {
      const oldFolderPath = path.join(oldPath, folder);
      const newFolderPath = path.join(newPath, folder);
      try {
        fs.mkdirSync(newFolderPath);
      } catch (err) {
        console.error(err);
      }
      const newFolderContents = readDirectoryContents(oldFolderPath);
      if (
        newFolderContents.files.length != 0 ||
        newFolderContents.folders.length != 0
      ) {
        renameDirectoryContents(
          newFolderContents,
          oldFolderPath,
          newFolderPath
        );
      }
      fse.removeSync(oldFolderPath);
    });
}

//New route parameter is the relative path from uploads/ folder
//Not just the new folder name but the whole thing
function handleRoute(newRoute) {
  const namePathArray = [];
  if (newRoute === '/') return namePathArray;

  //trimming "/"
  if (newRoute.at(0) === '/') newRoute = newRoute.slice(1);
  if (newRoute.at(newRoute.length - 1) === '/')
    newRoute = newRoute.slice(0, -1);

  let pathTracker = '/';
  newRoute.split('/').forEach((el, i) => {
    pathTracker += `${el}/`;
    namePathArray.push({
      name: el,
      path: pathTracker,
    });
  });

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
  console.log(`Server listening on ` + `http://localhost:${port}`.bgBlue);
});
