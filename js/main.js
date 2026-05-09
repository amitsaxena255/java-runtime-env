import { logger } from './utils/logger.js';
import { telemetry } from './utils/telemetry.js';
import { initEditor, getCode, resetToDefault } from './editor/editor.js';
import { formatCode } from './editor/formatter.js';
import { setupThemeToggle } from './ui/theme.js';
import { executeJava } from './runner.js';

logger.info('Oasis IDE starting up...');
telemetry.track('app_load');

window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
window.require(['vs/editor/editor.main'], function () {
    const editor = initEditor('editor');
    setupEventListeners(editor);
    logger.info('Oasis IDE fully loaded');
});

function setupEventListeners(editor) {
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', clearOutput);
    document.getElementById('resetBtn').addEventListener('click', () => resetToDefault());
    document.getElementById('formatBtn').addEventListener('click', formatCode);
    
    setupThemeToggle();

    editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, runCode);
}

function clearOutput() {
    document.getElementById('output').textContent = '';
    document.getElementById('error').textContent = '';
    document.getElementById('error').classList.remove('active');
    telemetry.track('output_cleared');
}

function displayOutput(output) {
    document.getElementById('output').textContent = output;
    document.getElementById('error').classList.remove('active');
}

function displayError(message) {
    document.getElementById('output').textContent = '';
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.classList.add('active');
}

async function runCode() {
    const code = getCode();
    clearOutput();
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');

    try {
        const output = await executeJava(code);
        displayOutput(output);
    } catch (error) {
        displayError(error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}
