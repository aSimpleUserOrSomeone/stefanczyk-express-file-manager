async function fetchPhoto(currentRoute, fileName) {

    const data = { currentRoute, fileName }
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

const imgData = await fetchPhoto("/", "kot.jpg")

async function loadImage() {
    const image = new Image()
    image.onload = () => {
        ctx.drawImage(image, 0, 0)
        console.log("KOK");
    }

    const photoCanvas = document.querySelector("#photo-frame")
    let ctx = photoCanvas.getContext("2d")

    image.src = `data:image;base64, ${imgData.file.base64}`
}

loadImage()

function loadFilter() {
    const asideImages = document.querySelector(".aside-iamge")
    asideImages.forEach(img => {
        img.style.backgroundImage = `url('')`
    })
}
