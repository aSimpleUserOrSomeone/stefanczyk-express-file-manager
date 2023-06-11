async function fetchPhoto(photoPath) {

    const data = { photoPath: photoPath }
    const options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }

    try {
        const request = await fetch("http://localhost:5500/getPhoto", options)
        const dataJSON = await request.json()

        console.log(dataJSON);
        return dataJSON
    } catch (e) {
        console.error(e);
    }
}

let _imgData = null
let _photoCanvas = null
let _ctx = null
const _image = new Image()
const _photoPath = document.querySelector("#photo-path").innerHTML

async function loadImage(photoPath) {
    _imgData = await fetchPhoto(photoPath)
    _image.onload = () => {
        _photoCanvas.width = _image.naturalWidth
        _photoCanvas.height = _image.naturalHeight
        _ctx.drawImage(_image, 0, 0)
        console.log("Image loaded!");
    }

    _photoCanvas = document.querySelector("#photo-frame")
    _ctx = _photoCanvas.getContext("2d")

    _image.src = `data:image;base64, ${_imgData.file.base64}`
    loadFilters()
}

loadImage(_photoPath)

function loadFilters() {
    const asideImages = document.querySelectorAll(".aside-image")
    asideImages.forEach(img => {
        img.style.backgroundImage = `url('data:image;base64, ${_imgData.file.base64}')`
    })
}

function handleFilterButtons() {
    const filterButtons = document.querySelectorAll(".photo-filter>button")
    filterButtons.forEach(btn => {
        const btnFilter = btn.innerHTML
        btn.addEventListener('click', () => {
            btnFilter === "none" ? _ctx.filter = `${btnFilter}` : _ctx.filter = `${btnFilter}(100%)`
            _ctx.drawImage(_image, 0, 0)

        })
    })
}

handleFilterButtons()

async function saveChanges() {
    let urlData = ""
    urlData = _photoCanvas.toDataURL("image/jpeg")
    urlData = urlData.slice(urlData.indexOf(",") + 1)

    const data = {
        dataUrl: urlData,
        photoPath: _photoPath
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }

    try {
        const dataBuffer = await fetch("http://localhost:5500/photoEdit", options)
        const dataJSON = await dataBuffer.json()
        console.log(dataJSON);
    } catch (e) {
        console.error(e);
    }
}

const savePhotoBtn = document.querySelector("#save-photo")
savePhotoBtn.addEventListener("click", () => saveChanges())

async function previewPhoto() {
    let urlData = ""
    urlData = _photoCanvas.toDataURL("image")

    _image.style.display = 'block';
    _image.style.width = 200 + "px";
    _image.style.height = 200 + "px";
    window.open(urlData, 'Image', 'width=_image.stylewidth,height=_image.style.height,resizable=1');
}
const previewPhotoBtn = document.querySelector("#preview-photo")
previewPhotoBtn.addEventListener("click", () => previewPhoto())

async function renamePhoto() {
    const oldPath = _photoPath
    const filePath = oldPath.slice(0, oldPath.lastIndexOf("/") + 1)
    let fileName = prompt("Podaj nową nazwę").replace("/", "")
    if (!fileName.includes(".")) fileName += oldPath.slice(oldPath.lastIndexOf("."))
    const newPath = oldPath.slice(0, oldPath.lastIndexOf("/") + 1) + fileName

    console.log(fileName);

    const data = {
        oldPath, newPath, filePath, fileName
    }
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        redirect: "follow"
    }

    try {
        const req = await fetch("http://localhost:5500/photoRename", options)
        window.location.replace(req.url)
    } catch (e) {
        console.error(e);
    }
}

const renamePhotoBtn = document.querySelector("#rename-photo")
renamePhotoBtn.addEventListener("click", () => renamePhoto())