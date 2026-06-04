import { logger } from '../utils/logger.js';
import { getEditor } from './editor.js';

let files = {};
let activeFileName = null;
let onFilesChangedCallback = null;

const DEFAULT_CODE = `public class Solution {
    public static void main(String[] args) {
        solution();
    }

    public static void solution() {
        System.out.println("Welcome to Oasis IDE!");
    }
}`;

export function initFileSystem(onFilesChanged) {
    onFilesChangedCallback = onFilesChanged;
    
    // Read files from localStorage or set default
    let savedFiles;
    try {
        savedFiles = JSON.parse(localStorage.getItem('oasis_workspace_files'));
    } catch (e) {
        logger.error('Failed to parse saved files', e);
    }

    if (!savedFiles || Object.keys(savedFiles).length === 0) {
        savedFiles = {
            'Solution.java': DEFAULT_CODE
        };
    }

    const editor = getEditor();
    for (const [name, content] of Object.entries(savedFiles)) {
        // Create Monaco Model
        const model = window.monaco.editor.createModel(content, 'java');
        files[name] = {
            name,
            model
        };
        
        // Save content to localStorage on change
        model.onDidChangeContent(() => {
            saveToLocalStorage();
        });
    }

    // Set first file as active
    activeFileName = Object.keys(files)[0] || 'Solution.java';
    if (editor && files[activeFileName]) {
        editor.setModel(files[activeFileName].model);
    }
    
    logger.info('FileSystem initialized', Object.keys(files));
    notifyChange();
}

export function saveToLocalStorage() {
    const rawFiles = {};
    for (const [name, file] of Object.entries(files)) {
        rawFiles[name] = file.model.getValue();
    }
    localStorage.setItem('oasis_workspace_files', JSON.stringify(rawFiles));
}

function notifyChange() {
    if (onFilesChangedCallback) {
        onFilesChangedCallback({
            files: getFileNames(),
            active: activeFileName
        });
    }
}

export function getFileNames() {
    return Object.keys(files);
}

export function getActiveFileName() {
    return activeFileName;
}

export function getFileContent(name) {
    return files[name] ? files[name].model.getValue() : '';
}

export function setFileContent(name, content) {
    if (files[name]) {
        files[name].model.setValue(content);
        saveToLocalStorage();
    }
}

export function getAllFilesContent() {
    let combined = '';
    for (const [name, file] of Object.entries(files)) {
        combined += `\n/* FILE: ${name} */\n` + file.model.getValue();
    }
    return combined;
}

export function getActiveFileContent() {
    return getFileContent(activeFileName);
}

export function setActiveFile(name) {
    if (!files[name]) return;
    activeFileName = name;
    const editor = getEditor();
    if (editor) {
        editor.setModel(files[name].model);
    }
    notifyChange();
}

export function createFile(name, content = '') {
    if (!name.endsWith('.java')) {
        name += '.java';
    }
    if (files[name]) {
        return false; // already exists
    }

    const model = window.monaco.editor.createModel(content, 'java');
    files[name] = {
        name,
        model
    };

    model.onDidChangeContent(() => {
        saveToLocalStorage();
    });

    saveToLocalStorage();
    setActiveFile(name);
    notifyChange();
    return true;
}

export function deleteFile(name) {
    if (!files[name] || Object.keys(files).length <= 1) {
        return false; // Can't delete last file or non-existent file
    }

    // Dispose Monaco model
    files[name].model.dispose();
    delete files[name];

    if (activeFileName === name) {
        activeFileName = Object.keys(files)[0];
        const editor = getEditor();
        if (editor && files[activeFileName]) {
            editor.setModel(files[activeFileName].model);
        }
    }

    saveToLocalStorage();
    notifyChange();
    return true;
}

export function renameFile(oldName, newName) {
    if (!files[oldName] || files[newName] || !newName.endsWith('.java')) {
        return false;
    }

    const content = files[oldName].model.getValue();
    
    // Create new, dispose old
    files[oldName].model.dispose();
    delete files[oldName];

    const model = window.monaco.editor.createModel(content, 'java');
    files[newName] = {
        name: newName,
        model
    };

    model.onDidChangeContent(() => {
        saveToLocalStorage();
    });

    if (activeFileName === oldName) {
        activeFileName = newName;
        const editor = getEditor();
        if (editor) {
            editor.setModel(model);
        }
    }

    saveToLocalStorage();
    notifyChange();
    return true;
}
