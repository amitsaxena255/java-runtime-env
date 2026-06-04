import { logger } from './utils/logger.js';
import { telemetry } from './utils/telemetry.js';
import { initEditor, getCode, setCode, resetToDefault } from './editor/editor.js';
import { formatCode } from './editor/formatter.js';
import { setupThemeToggle } from './ui/theme.js';
import { executeJava } from './runner.js';
import { autoImport } from './editor/autoImport.js';

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

function clearOutput(isRunning = false) {
    document.getElementById('output').innerHTML = isRunning ? '' : '<div class="output-placeholder">Ready to compile. Awaiting execution...</div>';
    if (!isRunning) telemetry.track('output_cleared');
}

function displayOutput(output, timeTaken) {
    const outDiv = document.getElementById('output');
    outDiv.innerHTML = `
        <div class="output-meta">
            <span class="status-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Executed Successfully</span>
            <span class="time">Compiled in ${timeTaken} ms</span>
        </div>
        <div class="output-text success-text"></div>
    `;
    outDiv.querySelector('.output-text').textContent = output;
}

function displayError(message, timeTaken) {
    const outDiv = document.getElementById('output');
    outDiv.innerHTML = `
        <div class="output-meta">
            <span class="status-error"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Execution Failed</span>
            <span class="time">Failed after ${timeTaken} ms</span>
        </div>
        <div class="output-text error-text"></div>
    `;
    outDiv.querySelector('.output-text').textContent = message;
}

async function runCode() {
    const code = getCode();
    const importedCode = autoImport(code);
    if (importedCode !== code) {
        setCode(importedCode);
    }
    const finalCode = importedCode;
    clearOutput(true);
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');

    const start = performance.now();
    try {
        const output = await executeJava(finalCode);
        const timeTaken = Math.round(performance.now() - start);
        displayOutput(output, timeTaken);
    } catch (error) {
        const timeTaken = Math.round(performance.now() - start);
        displayError(error.message, timeTaken);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}
