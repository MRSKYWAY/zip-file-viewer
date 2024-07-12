const invoke = window.__TAURI__.invoke;
const RECENT_FILES_KEY = 'recentFiles';
const MAX_RECENT_FILES = 5;

document.getElementById('listFilesButton').addEventListener('click', async () => {
    const input = document.getElementById('zipFileInput');
    if (input.files.length === 0) {
        alert('Please select a ZIP file');
        return;
    }

    const file = input.files[0];
    const filePath = file.name; // Get the file name

    console.log('Selected file:', file);

    const uint8Array = await file.arrayBuffer().then(buffer => new Uint8Array(buffer));
    let password = '';

    while (true) {
        try {
            console.log('Sending file contents to Rust backend');
            const fileDetails = await invoke('list_zip_file_names', {
                fileContents: [...uint8Array],
                password
            });
            console.log('Received file details from Rust backend:', fileDetails);

            // Save file contents in file_contents.json
            saveFileContents(filePath, uint8Array);

            // Add file path to recent files
            addRecentFilePath(filePath);

            // Display file details
            displayFileDetails(fileDetails);

            break;
        } catch (error) {
            console.error('Failed to list files:', error);
            password = prompt('Failed to list files. Please enter the ZIP file password:', '');
            if (password === null) {
                alert('Password entry cancelled. Returning to home.');
                return;
            }
        }
    }
});

document.getElementById('clearFilesButton').addEventListener('click', () => {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';
});

function clearInvalidLocalStorage() {
    try {
        const data = localStorage.getItem(RECENT_FILES_KEY);
        if (data !== null) {
            JSON.parse(data);
        }
    } catch (error) {
        console.error('Clearing invalid localStorage data:', error);
        localStorage.removeItem(RECENT_FILES_KEY);
    }
}

function saveFileContents(fileName, fileContents) {
    try {
        // Create an object to store file contents
        const fileData = {
            fileName,
            contents: [...fileContents] // Convert Uint8Array to array for JSON serialization
        };

        // Fetch existing content or initialize empty array
        let allFiles = JSON.parse(localStorage.getItem('file_contents.json') || '[]');
        allFiles.push(fileData);

        // Store updated content back to file_contents.json
        localStorage.setItem('file_contents.json', JSON.stringify(allFiles));
    } catch (error) {
        console.error('Failed to save file contents to file_contents.json:', error);
    }
}

function addRecentFilePath(filePath) {
    let recentFiles = [];
    try {
        const data = localStorage.getItem(RECENT_FILES_KEY);
        if (data !== null) {
            recentFiles = JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to parse recent files from localStorage:', error);
        recentFiles = [];
    }

    recentFiles = recentFiles.filter(file => file !== filePath);
    recentFiles.unshift(filePath);

    if (recentFiles.length > MAX_RECENT_FILES) {
        recentFiles.pop();
    }

    try {
        localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles));
    } catch (error) {
        console.error('Failed to save recent files to localStorage:', error);
    }

    displayRecentFiles();
}

function displayRecentFiles() {
    let recentFiles = [];
    try {
        const data = localStorage.getItem(RECENT_FILES_KEY);
        if (data !== null) {
            recentFiles = JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to parse recent files from localStorage:', error);
        recentFiles = [];
    }

    const recentFilesList = document.getElementById('recentFilesList');
    recentFilesList.innerHTML = '';

    recentFiles.forEach(filePath => {
        const li = document.createElement('li');
        li.textContent = filePath;
        li.addEventListener('click', () => openRecentFile(filePath));
        recentFilesList.appendChild(li);
    });
}

async function openRecentFile(filePath) {
    console.log('Opening recent file:', filePath);

    try {
        // Retrieve file contents from file_contents.json
        const allFiles = JSON.parse(localStorage.getItem('file_contents.json') || '[]');
        const fileData = allFiles.find(file => file.fileName === filePath);
        if (!fileData) {
            console.error('File not found in file_contents.json:', filePath);
            return;
        }

        // Simulate sending file contents to Rust backend (if needed)
        const fileDetails = await invoke('list_zip_file_names', {
            fileContents: fileData.contents // Use the stored contents
        });
        console.log('Received file details from Rust backend:', fileDetails);

        // Display file details
        displayFileDetails(fileDetails);

    } catch (error) {
        console.error('Failed to list files:', error);
        alert('Failed to list files. Please try again.');
    }
}

function displayFileDetails(fileDetails) {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    fileDetails.forEach(detail => {
        const li = document.createElement('li');
        li.textContent = `${detail.name} (Size: ${detail.size} bytes, Compressed Size: ${detail.compressed_size} bytes)`;
        fileList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    clearInvalidLocalStorage();
    displayRecentFiles();
});
