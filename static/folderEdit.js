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