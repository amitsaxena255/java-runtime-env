import { logger } from './utils/logger.js';
import { telemetry } from './utils/telemetry.js';
import { initEditor, getCode, setCode, resetToDefault } from './editor/editor.js';
import { formatCode } from './editor/formatter.js';
import { setupThemeToggle } from './ui/theme.js';
import { executeJava } from './runner.js';
import { autoImport } from './editor/autoImport.js';

// Pro Upgrades Imports
import { loadTemplate } from './editor/templates.js';
import { selectChallenge, runChallengeTests, getActiveChallenge } from './ui/challenges.js';
import { initDebugger, startDebugSession, stopDebugSession, stepOver, resumeExecution, isDebugSessionActive } from './ui/debugger.js';

let isTemplateLoading = false;

logger.info('Oasis IDE starting up...');
telemetry.track('app_load');

window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
window.require(['vs/editor/editor.main'], function () {
    const editor = initEditor('editor');
    
    // Initialize Debugger with line highlight and state callbacks
    initDebugger(updateDebugLineUI, toggleDebugControlsUI);
    
    // Expose helpers for testing & integration
    window.oasis = {
        editor,
        debugger: {
            startDebugSession,
            stopDebugSession,
            stepOver,
            resumeExecution,
            isDebugSessionActive
        }
    };
    
    setupEventListeners(editor);
    setupProEventListeners();
    logger.info('Oasis IDE fully loaded');
});

function setupEventListeners(editor) {
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', () => clearOutput());
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetToDefault();
        document.getElementById('templateSelector').value = '';
    });
    document.getElementById('formatBtn').addEventListener('click', formatCode);
    
    setupThemeToggle();

    editor.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter, runCode);

    // Reset template dropdown when user edits the code
    editor.onDidChangeModelContent(() => {
        if (!isTemplateLoading) {
            document.getElementById('templateSelector').value = '';
        }
    });

    // Reset template dropdown when switching files/models
    editor.onDidChangeModel(() => {
        document.getElementById('templateSelector').value = '';
    });
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
    
    clearOutput(true);
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');

    const start = performance.now();
    try {
        const output = await executeJava(importedCode, false);
        const timeTaken = Math.round(performance.now() - start);
        displayOutput(output, timeTaken);
    } catch (error) {
        const timeTaken = Math.round(performance.now() - start);
        displayError(error.message, timeTaken);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// Pro Feature UI Binding
function setupProEventListeners() {
    // Sidebar Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetPane = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(`pane-${targetPane}`).classList.add('active');
        });
    });

    // Templates Selector
    document.getElementById('templateSelector').addEventListener('change', (e) => {
        const templateName = e.target.value;
        if (templateName) {
            isTemplateLoading = true;
            loadTemplate(templateName);
            isTemplateLoading = false;
        }
    });

    // Challenge selector
    document.getElementById('challengeSelector').addEventListener('change', (e) => {
        const challengeId = e.target.value;
        const detailPanel = document.getElementById('challengeDetailPanel');
        if (challengeId) {
            const challenge = selectChallenge(challengeId);
            document.getElementById('challengeDesc').innerHTML = challenge.description.replace(/\n/g, '<br>');
            detailPanel.classList.remove('hidden');
        } else {
            detailPanel.classList.add('hidden');
        }
    });

    // Challenge testing
    document.getElementById('runTestsBtn').addEventListener('click', runTests);

    // Debugger controls
    document.getElementById('debugStartBtn').addEventListener('click', startDebugging);
    document.getElementById('debugResumeBtn').addEventListener('click', resumeExecution);
    document.getElementById('debugStepBtn').addEventListener('click', stepOver);
    document.getElementById('debugStopBtn').addEventListener('click', () => stopDebugSession());
}

// Challenge testing function
async function runTests() {
    const challenge = getActiveChallenge();
    if (!challenge) return;
    
    clearOutput(true);
    const outDiv = document.getElementById('output');
    outDiv.innerHTML = `
        <div class="output-meta">
            <span class="status-success">Testing Solution...</span>
        </div>
        <div class="output-text">Running test cases against ${challenge.title}...</div>
    `;

    const userCode = getCode();
    const result = await runChallengeTests(userCode);
    
    if (result.error) {
        displayError(result.error, 0);
        return;
    }
    
    let html = `
        <div class="output-meta">
            <span class="${result.success ? 'status-success' : 'status-error'}">
                ${result.success ? '🏆 All Tests Passed!' : '❌ Some Tests Failed'} (${result.passed}/${result.total})
            </span>
        </div>
        <div class="output-text">
    `;
    
    result.cases.forEach(c => {
        html += `Case ${c.caseNum}: <b>${c.status}</b> - ${c.details}<br>`;
    });
    
    html += `<br><b>Console Output:</b><br>${result.rawOutput}</div>`;
    outDiv.innerHTML = html;
}

// Debugger UI Updates
function updateDebugLineUI(lineNum) {
    document.getElementById('debugLineNum').textContent = lineNum;
}

function toggleDebugControlsUI(active) {
    const startBtn = document.getElementById('debugStartBtn');
    const activeGroup = document.getElementById('debugActiveGroup');
    if (active) {
        startBtn.classList.add('hidden');
        activeGroup.classList.remove('hidden');
    } else {
        startBtn.classList.remove('hidden');
        activeGroup.classList.add('hidden');
    }
}

// Start Debugger session
async function startDebugging() {
    startDebugSession();
    clearOutput(true);
    
    const outDiv = document.getElementById('output');
    outDiv.innerHTML = `
        <div class="output-meta">
            <span class="status-success">Debug Session Active</span>
        </div>
        <div class="output-text success-text">Paused on first breakpoint. Use controls to step through code.</div>
    `;
    
    const finalCode = getCode();
    
    try {
        const output = await executeJava(finalCode, true);
        displayOutput(output, 0);
    } catch (error) {
        if (!error.message.includes('Debug Session Terminated')) {
            displayError(error.message, 0);
        } else {
            outDiv.innerHTML = `
                <div class="output-meta">
                    <span class="status-error">Execution Terminated</span>
                </div>
                <div class="output-text error-text">Debug execution terminated.</div>
            `;
        }
    } finally {
        stopDebugSession();
    }
}
