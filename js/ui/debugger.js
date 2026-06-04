import { getEditor } from '../editor/editor.js';
import { logger } from '../utils/logger.js';

let isDebugging = false;
let shouldPause = false;
let activeLine = null;
let pausedResolve = null;
let currentDecorations = [];
let onLineChangedCallback = null;
let onDebugStateChangedCallback = null;

export function initDebugger(onLineChanged, onDebugStateChanged) {
    onLineChangedCallback = onLineChanged;
    onDebugStateChangedCallback = onDebugStateChanged;
    
    // Register global hook for transpiled code
    window.debugLine = async function(lineNum) {
        if (!isDebugging) return;
        
        logger.debug(`debugLine reached: ${lineNum}`);
        
        let displayLine = lineNum;
        if (window.LINE_MAP && window.LINE_MAP[lineNum]) {
            const mapping = window.LINE_MAP[lineNum];
            if (mapping.file) {
                // Switch file in editor if it's different
                if (window.oasis && window.oasis.fileSystem) {
                    const activeFile = window.oasis.fileSystem.getActiveFileName();
                    if (activeFile !== mapping.file) {
                        window.oasis.fileSystem.setActiveFile(mapping.file);
                    }
                }
                displayLine = mapping.line;
            }
        }
        
        activeLine = displayLine;
        
        if (onLineChangedCallback) {
            onLineChangedCallback(displayLine);
        }

        const editor = getEditor();
        if (editor) {
            highlightLine(editor, displayLine);
        }

        if (shouldPause) {
            // Create a promise that pauses the execution until resolved by step/resume controls
            return new Promise((resolve, reject) => {
                pausedResolve = (action) => {
                    clearHighlights();
                    if (action === 'stop') {
                        reject(new Error('Debug Session Terminated'));
                    } else {
                        resolve();
                    }
                };
            });
        }
    };
}

function highlightLine(editor, lineNum) {
    // Monaco decorations
    currentDecorations = editor.deltaDecorations(currentDecorations, [
        {
            range: new window.monaco.Range(lineNum, 1, lineNum, 1),
            options: {
                isWholeLine: true,
                className: 'debug-line-highlight',
                marginClassName: 'debug-line-margin'
            }
        }
    ]);
    editor.revealLineInCenterIfOutsideViewport(lineNum);
}

export function clearHighlights() {
    const editor = getEditor();
    if (editor && currentDecorations.length > 0) {
        currentDecorations = editor.deltaDecorations(currentDecorations, []);
    }
}

export function startDebugSession() {
    isDebugging = true;
    shouldPause = true;
    activeLine = null;
    pausedResolve = null;
    clearHighlights();
    
    if (onDebugStateChangedCallback) {
        onDebugStateChangedCallback(true);
    }
}

export function stopDebugSession() {
    if (!isDebugging) return;
    
    isDebugging = false;
    shouldPause = false;
    clearHighlights();
    
    if (pausedResolve) {
        pausedResolve('stop');
        pausedResolve = null;
    }
    
    if (onDebugStateChangedCallback) {
        onDebugStateChangedCallback(false);
    }
}

export function stepOver() {
    if (pausedResolve) {
        shouldPause = true;
        const res = pausedResolve;
        pausedResolve = null;
        res('step');
    }
}

export function resumeExecution() {
    if (pausedResolve) {
        shouldPause = false;
        const res = pausedResolve;
        pausedResolve = null;
        res('resume');
    }
}

export function getActiveDebugLine() {
    return activeLine;
}

export function isDebugSessionActive() {
    return isDebugging;
}
