const btnFolder = document.querySelector("button#folder")
const btnFile = document.querySelector("button#file")
const btnUpload = document.querySelector("button#upload")
const dialog = document.querySelector("dialog#myDialog")
const btnCloseDialog = document.querySelector("button#btnCloseDialog")

btnCloseDialog.addEventListener("click", () => { dialog.close() })
const btnSubmitDialog = document.querySelector("button#btnSubmitDialog")
const submitHeading = document.querySelector("h2#submitHeading")
const submitForm = document.querySelector("form#submitForm")

btnFolder.addEventListener("click", () => showDialog("folder"))
btnFile.addEventListener("click", () => showDialog("file"))
dialog.addEventListener("close", () => submitForm.reset())
function showDialog(type) {
    if (type === "folder") {
        submitHeading.textContent = "Podaj nazwę folderu"
        btnSubmitDialog.value = "folder"
    } else if (type === "file") {
        submitHeading.textContent = "Podaj nazwę pliku wraz z rozszerzeniem"
        btnSubmitDialog.value = "file"
    }
    dialog.showModal()
}

const btnCloseRenameDialog = document.querySelector("button#btnCloseRenameDialog")
btnCloseRenameDialog.addEventListener("click", () => renameDialog.close())
const submitRenameForm = document.querySelector("form#submitRenameForm")
const btnRenameFolder = document.querySelector("button#renameFolder")
const renameDialog = document.querySelector("dialog#renameDialog")
if (btnRenameFolder) {
    btnRenameFolder.addEventListener('click', () => showRenameDialog())
    renameDialog.addEventListener("close", () => submitRenameForm.reset())

}
function showRenameDialog() {
    renameDialog.showModal()
}

function confirmForm(form) {
    if (confirm("Czy chcesz usunąć ten element?")) {
        return true
    } else {
        return false
    }
}