const btnFolder = document.querySelector("button#folder")
const btnFile = document.querySelector("button#file")
const btnUpload = document.querySelector("button#upload")
const dialog = document.querySelector("dialog#myDialog")
const btnCloseDialog = document.querySelector("button#btnCloseDialog")

btnCloseDialog.addEventListener("click", () => { dialog.close() })
const btnSubmitDialog = document.querySelector("button#btnSubmitDialog")
const submitHeading = document.querySelector("h2#submitHeading")
const submitForm = document.querySelector("form#submitForm")

btnFolder ? btnFolder.addEventListener("click", () => showDialog("folder")) : null
btnFile ? btnFile.addEventListener("click", () => showDialog("file")) : null
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


function confirmForm(form) {
    if (confirm("Czy chcesz usunąć ten element?")) {
        return true
    } else {
        return false
    }
}
