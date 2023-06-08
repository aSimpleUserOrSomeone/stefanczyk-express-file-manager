const urlParams = new URLSearchParams(window.location.search)

//text editor code
const codeEditor = document.getElementById('editor-textarea');
const lineCounter = document.getElementById('editor-line-counter');

//synchronize the scrolls on the textareas
codeEditor ? codeEditor.addEventListener('scroll', () => {
    lineCounter.scrollTop = codeEditor.scrollTop;
    lineCounter.scrollLeft = codeEditor.scrollLeft;
}) : console.error("No code editor!");

//handle clicking the tab key
codeEditor.addEventListener('keydown', (e) => {
    let { key } = e;
    if (key === "Tab") {  // TAB = 9
        e.preventDefault();
    }
});
codeEditor.addEventListener('keyup', (e) => {
    let { key } = e;
    let { value, selectionStart, selectionEnd } = codeEditor;

    if (key === "Tab") {  // TAB = 9
        if (selectionEnd === selectionStart) {
            codeEditor.value = value.slice(0, selectionStart) + '\xa0\xa0\xa0\xa0' + value.slice(selectionEnd);
            codeEditor.setSelectionRange(selectionStart + 4, selectionStart + 4)
        } else {

        }
    }
});

//handle counting lines
var lineCountCache = 0;
function line_counter() {
    var lineCount = codeEditor.value.split('\n').length;
    var outarr = new Array();
    if (lineCountCache != lineCount) {
        for (var x = 0; x < lineCount; x++) {
            outarr[x] = (x + 1) + '.';
        }
        lineCounter.value = outarr.join('\n');
    }
    lineCountCache = lineCount;
}
codeEditor.addEventListener('input', () => {
    line_counter();
});

line_counter()
//now the aside shit

//presets
const colorThemes = [
    {
        name: "dark",
        textCounter: "#272822",
        backgroundCounter: "#ffffff",
        textEditor: "#ffffff",
        backgroundEditor: "#272822",
    },
    {
        name: "light",
        textCounter: "#fff",
        backgroundCounter: "#272822",
        textEditor: "#272822",
        backgroundEditor: "#fff",
    },
    {
        name: "cancer",
        textCounter: "lime",
        backgroundCounter: "#140BD9",
        textEditor: "#21FFF0",
        backgroundEditor: "#BF20F8",
    },
]
let selectedThemeName = "dark"

const fontSizes = ["10px", "12px", "16px", "20px", "24px"]
let selectedSizeIndex = 3

function fontP() {
    selectedSizeIndex < 4 ? selectedSizeIndex += 1 : null
    updateEditorLook()
}
function fontM() {
    selectedSizeIndex > 0 ? selectedSizeIndex -= 1 : null
    updateEditorLook()

}
function changeColor() {
    console.log(selectedThemeName);
    if (selectedThemeName === "dark") {
        selectedThemeName = "light"
    } else if (selectedThemeName === "light") {
        selectedThemeName = "cancer"
    } else {
        selectedThemeName = "dark"
    }

    updateEditorLook()
}

function updateEditorLook(fontIndex, colorTheme) {
    if (fontIndex !== undefined)
        selectedSizeIndex = fontIndex
    if (colorTheme !== undefined)
        selectedThemeName = colorTheme

    const [currentTheme] = colorThemes.filter(theme => theme.name === selectedThemeName)
    const currentFontSize = fontSizes[selectedSizeIndex]

    lineCounter.style.color = currentTheme.textCounter
    lineCounter.style.backgroundColor = currentTheme.backgroundCounter
    codeEditor.style.color = currentTheme.textEditor
    codeEditor.style.backgroundColor = currentTheme.backgroundEditor

    lineCounter.style.fontSize = currentFontSize
    codeEditor.style.fontSize = currentFontSize
}

async function postFilePreferneces(fileName, fontIndex = undefined, colorTheme = undefined) {
    const data = { fileName, fontIndex, colorTheme }

    try {
        const request = await fetch("http://localhost:5500/preferences", {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })

        const dataJSON = await request.json()
        updateEditorLook(dataJSON.fontIndex, dataJSON.colorTheme)
    } catch (e) {
        console.error(e);
    }
}

//getting htmlElements
const btnFontP = document.querySelector("#font-p")
const btnFontM = document.querySelector("#font-m")
const btnColors = document.querySelector("#colors")

const btnSaveSettings = document.querySelector("#save-settings")
const btnChangeName = document.querySelector("#change-name")
const btnSaveChanges = document.querySelector("#save-changes")

const pFileName = document.querySelector("#file-name")
let fileName = pFileName.innerHTML || console.error("NO FILENAME")

btnFontP.addEventListener("click", fontP)
btnFontM.addEventListener("click", fontM)
btnColors.addEventListener("click", changeColor)

btnSaveSettings.addEventListener("click", () => {
    postFilePreferneces(fileName, selectedSizeIndex, selectedThemeName)
})

btnSaveChanges.addEventListener("click", async () => {
    const filePath = urlParams.get("newRoute")
    const data = { fileContents: codeEditor.value, fileName, filePath }

    try {

        const reqBuffer = await fetch("http://localhost:5500/editText", {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        const dataJSON = await reqBuffer.json()
        if (dataJSON.RES === "OK") {
            alert("Poprawnie zmieniono tekst!")
        } else {
            alert("Błąd podczas zmiany tekstu")
        }
    } catch (e) {
        console.error(e);
    }
})

postFilePreferneces(fileName)

//renaming files

const btnCloseRenameDialog = document.querySelector("button#btnCloseRenameDialog")
btnCloseRenameDialog.addEventListener("click", () => renameDialog.close())
const submitRenameForm = document.querySelector("form#submitRenameForm")
const btnRenameFolder = document.querySelector("button#change-name")
const renameDialog = document.querySelector("dialog#renameDialog")
const inpName = document.querySelector("input#inpName")
if (btnRenameFolder) {
    btnRenameFolder.addEventListener('click', () => renameDialog.showModal())
    renameDialog.addEventListener("close", () => submitRenameForm.reset())

}
const btnSubmit = document.querySelector("#btnSubmitDialog")

async function validateNewName(form) {
    const oldName = fileName
    const newName = inpName.value
    const filePath = urlParams.get("newRoute")

    const data = { oldName, newName, filePath }

    try {
        const dataBuffer = await fetch("http://localhost:5500/renameFile", {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        const dataJSON = await dataBuffer.json()
        if (dataJSON.RES === "OK") {
            pFileName.innerHTML = newName
            fileName = newName
        }

    } catch (e) {
        console.error(e);
    }

    renameDialog.close()
    return false
}

