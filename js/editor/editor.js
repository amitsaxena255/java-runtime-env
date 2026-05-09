import { logger } from '../utils/logger.js';
import { telemetry } from '../utils/telemetry.js';

let editorInstance = null;

const DEFAULT_CODE = `public class Solution {
    public static void main(String[] args) {
        System.out.println("Welcome to Oasis IDE!");
    }
}`;

export function initEditor(containerId) {
    if (editorInstance) return editorInstance;

    logger.info('Initializing Monaco Editor');
    
    const savedCode = localStorage.getItem('javaCode');
    const isDark = document.body.classList.contains('dark-theme');
    
    editorInstance = window.monaco.editor.create(document.getElementById(containerId), {
        value: savedCode || DEFAULT_CODE,
        language: 'java',
        theme: isDark ? 'vs-dark' : 'vs',
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        roundedSelection: false,
        padding: { top: 16, bottom: 16 }
    });

    editorInstance.onDidChangeModelContent(() => {
        saveCode();
    });

    telemetry.track('editor_initialized', { hasSavedCode: !!savedCode });
    return editorInstance;
}

export function getEditor() {
    return editorInstance;
}

export function getCode() {
    return editorInstance ? editorInstance.getValue() : '';
}

export function setCode(code) {
    if (editorInstance) {
        editorInstance.setValue(code);
    }
}

export function resetToDefault() {
    setCode(DEFAULT_CODE);
    telemetry.track('code_reset');
    logger.info('Editor reset to default code');
}

function saveCode() {
    if (editorInstance) {
        localStorage.setItem('javaCode', editorInstance.getValue());
    }
}
