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

    // Update the native input's file list to match filesToUpload
    function updateFileInput() {
        try {
            const dataTransfer = new DataTransfer();
            filesToUpload.forEach(fileObj => {
                dataTransfer.items.add(fileObj.file);
            });
            presentationFilesInput.files = dataTransfer.files;
        } catch (e) {
            console.error('Error updating native file input:', e);
        }
    }

    // Display detailed upload results
    function displayUploadResults(result) {
        const results = result.results || [];
        const successFiles = results.filter(r => r.status === 'success');
        const failedFiles = results.filter(r => r.status === 'failed');

        if (results.length === 0) {
            uploadStatus.innerHTML = `<div class="alert alert-danger">${result.message || 'Error desconocido'}</div>`;
            return;
        }

        let html = '';
        if (failedFiles.length === 0) {
            // All succeeded
            const fileCount = successFiles.length;
            html = `
                <div class="alert alert-success text-start shadow-sm border-0" style="border-radius: 10px; background: rgba(25, 135, 84, 0.1); color: #198754;">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-check-circle-fill me-2 fs-5 text-success"></i>
                        <strong class="text-success">¡Todos los archivos subieron bien! (${fileCount} ${fileCount === 1 ? 'archivo' : 'archivos'})</strong>
                    </div>
                    <div>
                        <button type="button" id="toggle-success-list" class="btn btn-link btn-sm p-0 text-success text-decoration-underline text-start" style="font-weight: 500; font-size: 0.9em; box-shadow: none;">
                            Toca aquí para ver los archivos
                        </button>
                        <ul id="success-list" class="d-none mt-2 list-group list-group-flush border-top border-success-subtle pt-2 bg-transparent">
                            ${successFiles.map(f => `<li class="list-group-item bg-transparent text-success border-0 py-1 ps-0" style="font-size: 0.85em;"><i class="bi bi-file-earmark-check me-2 text-success"></i>${f.filename}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
            filesToUpload = []; // Clear the list after successful upload
            renderSelectedFiles();
        } else if (successFiles.length === 0) {
            // All failed
            html = `
                <div class="alert alert-danger text-start shadow-sm border-0" style="border-radius: 10px; background: rgba(220, 53, 69, 0.1); color: #dc3545;">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-x-circle-fill me-2 fs-5 text-danger"></i>
                        <strong class="text-danger">No se pudo subir ningún archivo</strong>
                    </div>
                    <div class="mb-2" style="font-weight: 500;">Detalle de errores (los archivos ya existen o fallaron):</div>
                    <ul class="list-group list-group-flush border-top border-danger-subtle pt-2 bg-transparent">
                        ${failedFiles.map(f => `
                            <li class="list-group-item bg-transparent text-danger border-0 py-2 ps-0" style="font-size: 0.9em;">
                                <i class="bi bi-file-earmark-x-fill me-2 text-danger"></i>
                                <strong>${f.filename}</strong>: <span class="text-secondary small d-block ms-4" style="color: #6c757d !important;">${f.message || 'Error desconocido'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            // Partial success
            const successCount = successFiles.length;
            html = `
                <div class="alert alert-warning text-start shadow-sm border-0" style="border-radius: 10px; background: rgba(255, 193, 7, 0.1); color: #664d03;">
                    <div class="d-flex align-items-center mb-2">
                        <i class="bi bi-exclamation-triangle-fill me-2 fs-5 text-warning"></i>
                        <strong class="text-warning-emphasis">Subida completada con advertencias</strong>
                    </div>
                    <div class="mb-2">
                        <button type="button" id="toggle-success-list" class="btn btn-link btn-sm p-0 text-decoration-underline text-start" style="font-weight: 600; font-size: 0.9em; color: #664d03; box-shadow: none;">
                            Subieron bien: ${successCount} ${successCount === 1 ? 'archivo' : 'archivos'} (toca aquí para ver)
                        </button>
                        <ul id="success-list" class="d-none mt-2 list-group list-group-flush border-top border-warning-subtle pt-2 bg-transparent">
                            ${successFiles.map(f => `<li class="list-group-item bg-transparent text-success border-0 py-1 ps-0" style="font-size: 0.85em;"><i class="bi bi-file-earmark-check me-2 text-success"></i>${f.filename}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="mt-3 border-top border-warning-subtle pt-2">
                        <strong class="text-danger"><i class="bi bi-x-circle-fill me-2"></i>No subieron (ya existen o fallaron):</strong>
                        <ul class="list-group list-group-flush mt-1">
                            ${failedFiles.map(f => `
                                <li class="list-group-item bg-transparent text-danger border-0 py-2 ps-0" style="font-size: 0.9em;">
                                    <i class="bi bi-file-earmark-x-fill me-2 text-danger"></i>
                                    <strong>${f.filename}</strong>: <span class="text-secondary small d-block ms-4" style="color: #6c757d !important;">${f.message || 'Error'}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
            // Keep only the failed files in the filesToUpload list
            const failedNames = failedFiles.map(f => f.filename);
            filesToUpload = filesToUpload.filter(f => failedNames.includes(f.file.name));
            renderSelectedFiles();
        }

        uploadStatus.innerHTML = html;

        // Set up toggle click listener
        const toggleBtn = uploadStatus.querySelector('#toggle-success-list');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const successList = uploadStatus.querySelector('#success-list');
                if (successList) {
                    successList.classList.toggle('d-none');
                }
            });
        }
    }

    // Render the list of selected files
    function renderSelectedFiles() {
        selectedFilesList.innerHTML = '';
        if (filesToUpload.length === 0) {
            uploadPresentationsBtn.disabled = true;
            updateFileInput();
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
        updateFileInput();
    }

    // Check if all files have a type selected
    function checkUploadButtonStatus() {
        const allTypesSelected = filesToUpload.every(fileObj => fileObj.type !== "SELECCIONAR TIPO DE PRESENTACION");
        uploadPresentationsBtn.disabled = !allTypesSelected || filesToUpload.length === 0;
    }

    // Handle file input change
    presentationFilesInput.addEventListener('change', function() {
        // Add new files to the array avoiding duplicates
        Array.from(this.files).forEach(file => {
            const alreadySelected = filesToUpload.some(f => f.file.name === file.name && f.file.size === file.size);
            if (!alreadySelected) {
                filesToUpload.push({ file: file, type: "SELECCIONAR TIPO DE PRESENTACION" });
            }
        });
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

            let result;
            try {
                result = await response.json();
            } catch (e) {
                console.error("No se pudo parsear la respuesta JSON del servidor:", e);
            }

            if (result && result.results) {
                displayUploadResults(result);
            } else {
                if (response.ok) {
                    uploadStatus.innerHTML = `<div class="alert alert-success">${(result && result.message) || 'Subido correctamente'}</div>`;
                    filesToUpload = []; // Clear the list after successful upload
                    renderSelectedFiles();
                } else {
                    uploadStatus.innerHTML = `<div class="alert alert-danger">Error al subir: ${(result && result.message) || 'Error desconocido'}</div>`;
                }
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