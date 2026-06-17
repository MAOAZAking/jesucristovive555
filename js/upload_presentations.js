document.addEventListener('DOMContentLoaded', function() {
    const presentationFilesInput = document.getElementById('presentation-files');
    const selectedFilesList = document.getElementById('selected-files-list');
    const uploadPresentationsBtn = document.getElementById('upload-presentations-btn');
    const uploadStatus = document.getElementById('upload-status');

    let filesToUpload = []; // Array to hold file objects with their type

    // Function to truncate long filenames
    function truncateFilename(filename, maxLength = 30) {
        if (filename.length <= maxLength) {
            return filename;
        }
        const extension = filename.split('.').pop();
        const name = filename.substring(0, filename.length - extension.length - 1);
        return name.substring(0, maxLength - 3 - extension.length) + '...' + extension;
    }

    // Render the list of selected files
    function renderSelectedFiles() {
        selectedFilesList.innerHTML = '';
        if (filesToUpload.length === 0) {
            uploadPresentationsBtn.disabled = true;
            return;
        }

        filesToUpload.forEach((fileObj, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'd-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded shadow-sm';
            fileItem.innerHTML = `
                <div class="d-flex flex-column flex-grow-1">
                    <span class="fw-bold text-truncate" style="max-width: 90%;" title="${fileObj.file.name}">
                        <i class="bi bi-file-earmark-fill"></i> ${truncateFilename(fileObj.file.name)}
                    </span>
                    <select class="form-select form-select-sm w-auto mt-1" data-index="${index}">
                        <option value="SELECCIONAR TIPO DE PRESENTACION" disabled ${fileObj.type === "SELECCIONAR TIPO DE PRESENTACION" ? 'selected' : ''}>SELECCIONAR TIPO DE PRESENTACION</option>
                        <option value="alabanza" ${fileObj.type === "alabanza" ? 'selected' : ''}>Alabanza</option>
                        <option value="adoracion" ${fileObj.type === "adoracion" ? 'selected' : ''}>Adoración</option>
                    </select>
                </div>
                <button type="button" class="btn btn-sm btn-danger ms-2 align-self-start" data-index="${index}" title="Quitar archivo">
                    <i class="bi bi-x"></i>
                </button>
            `;
            selectedFilesList.appendChild(fileItem);
        });

        // Add event listeners for type change and remove buttons
        selectedFilesList.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', function() {
                const index = parseInt(this.dataset.index);
                filesToUpload[index].type = this.value;
                checkUploadButtonStatus();
            });
        });

        selectedFilesList.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                filesToUpload.splice(index, 1); // Remove file from array
                renderSelectedFiles(); // Re-render the list
                checkUploadButtonStatus();
            });
        });

        checkUploadButtonStatus();
    }

    // Check if all files have a type selected
    function checkUploadButtonStatus() {
        const allTypesSelected = filesToUpload.every(fileObj => fileObj.type !== "SELECCIONAR TIPO DE PRESENTACION");
        uploadPresentationsBtn.disabled = !allTypesSelected || filesToUpload.length === 0;
    }

    // Handle file input change
    presentationFilesInput.addEventListener('change', function() {
        // Add new files to the array
        Array.from(this.files).forEach(file => {
            filesToUpload.push({ file: file, type: "SELECCIONAR TIPO DE PRESENTACION" });
        });
        this.value = ''; // Clear the input so same files can be selected again if needed
        renderSelectedFiles();
    });

    // Handle upload button click
    uploadPresentationsBtn.addEventListener('click', async function() {
        if (filesToUpload.length === 0) {
            uploadStatus.innerHTML = '<div class="alert alert-warning">No hay archivos para subir.</div>';
            return;
        }

        uploadPresentationsBtn.disabled = true;
        uploadStatus.innerHTML = '<div class="alert alert-info"><span class="spinner-border spinner-border-sm me-2"></span>Subiendo archivos...</div>';

        const formData = new FormData();
        filesToUpload.forEach(fileObj => {
            formData.append('presentations', fileObj.file); // 'presentations' is the field name for multer
            formData.append('types', fileObj.type); // Send types separately
        });

        try {
            const response = await fetch('/api/upload-presentations', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                uploadStatus.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                filesToUpload = []; // Clear the list after successful upload
                renderSelectedFiles();
            } else {
                uploadStatus.innerHTML = `<div class="alert alert-danger">Error al subir: ${result.message || 'Error desconocido'}</div>`;
            }
        } catch (error) {
            console.error('Error during upload:', error);
            uploadStatus.innerHTML = `<div class="alert alert-danger">Error de conexión: ${error.message}</div>`;
        } finally {
            uploadPresentationsBtn.disabled = false; // Re-enable button
            checkUploadButtonStatus(); // Re-check status
        }
    });
});