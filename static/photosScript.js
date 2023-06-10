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
const _image = new Image()
const _photoPath = document.querySelector("#photo-path").innerHTML

async function loadImage(photoPath) {
    _imgData = await fetchPhoto(photoPath)
    _image.onload = () => {
        photoCanvas.width = _image.naturalWidth
        photoCanvas.height = _image.naturalHeight
        ctx.drawImage(_image, 0, 0)
        console.log("Image loaded!");
    }

    const photoCanvas = document.querySelector("#photo-frame")
    let ctx = photoCanvas.getContext("2d")

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
            console.log(btnFilter);
        })
    })
}
