// Configure Monaco Editor loader
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });

let editor;
const DEFAULT_CODE = `public class Solution {
    public static void main(String[] args) {
        solve();
    }
    
    static void solve() {
        // Write your Java code here
        System.out.println("Hello, Java!");
        
        // Example: Print numbers from 1 to 10
        for (int i = 1; i <= 10; i++) {
            System.out.println("Number: " + i);
        }
    }
}`;

// Initialize the application
require(['vs/editor/editor.main'], function() {
    initializeEditor();
    setupEventListeners();
    loadSavedCode();
});

function initializeEditor() {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: DEFAULT_CODE,
        language: 'java',
        theme: 'vs',
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
        minimap: { enabled: true },
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        renderWhitespace: 'none',
    });

    // Save code on every change
    editor.onDidChangeModelContent(() => {
        saveCode();
    });
}

function setupEventListeners() {
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('clearBtn').addEventListener('click', clearOutput);
    document.getElementById('resetBtn').addEventListener('click', resetTemplate);
    document.getElementById('formatBtn').addEventListener('click', formatCode);
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);
}

function saveCode() {
    const code = editor.getValue();
    localStorage.setItem('javaCode', code);
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    
    const isDark = body.classList.contains('dark-theme');
    document.getElementById('themeToggleBtn').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    
    if (editor) {
        monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
    }
}

function loadSavedCode() {
    const savedCode = localStorage.getItem('javaCode');
    if (savedCode) {
        editor.setValue(savedCode);
    }
}

function resetTemplate() {
    if (confirm('Are you sure you want to reset to the default template?')) {
        editor.setValue(DEFAULT_CODE);
        saveCode();
        clearOutput();
    }
}

function clearOutput() {
    document.getElementById('output').textContent = '';
    document.getElementById('error').textContent = '';
    document.getElementById('error').classList.remove('active');
}

function formatCode() {
    const code = editor.getValue();
    let formatted = '';
    let indentLevel = 0;
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.length === 0) {
            formatted += '\n';
            continue;
        }
        
        // Decrease indent for closing braces
        if (line.match(/^}/) || line.match(/^[}\]]/)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        formatted += '    '.repeat(indentLevel) + line + '\n';
        
        // Increase indent for opening braces
        if (line.match(/\{$/) || line.match(/\[$/)) {
            indentLevel++;
        }
    }
    
    // Set formatted code and keep cursor position roughly in place
    editor.executeEdits('format', [{
        range: editor.getModel().getFullModelRange(),
        text: formatted.replace(/\n$/, '')
    }]);
}

async function runCode() {
    const code = editor.getValue();
    clearOutput();
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');

    try {
        // Validate Java syntax
        if (!validateJavaCode(code)) {
            throw new Error('Invalid Java code structure. Please ensure you have a public class with a main method.');
        }

        // Execute the code
        const output = await executeJava(code);
        displayOutput(output);
    } catch (error) {
        displayError(error.message);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function validateJavaCode(code) {
    // Check for main class and main method
    const hasClass = /public\s+class\s+\w+/.test(code);
    const hasMain = /public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)/.test(code);
    return hasClass && hasMain;
}

async function executeJava(code) {
    // Parse and execute the Java code
    return new Promise((resolve, reject) => {
        try {
            // Extract class name
            const classMatch = code.match(/public\s+class\s+(\w+)/);
            const className = classMatch ? classMatch[1] : 'Solution';

            // Create a JavaScript equivalent of the Java code
            const jsCode = transpileJavaToJS(code);

            // Capture console output
            const output = [];
            const originalLog = console.log;
            console.log = (...args) => {
                output.push(args.join(' '));
            };

            // Execute the transpiled code
            const func = new Function(jsCode);
            func();

            // Restore original console.log
            console.log = originalLog;

            resolve(output.length > 0 ? output.join('\n') : '(No output)');
        } catch (error) {
            // Restore console.log if it failed mid-execution
            if (typeof originalLog !== 'undefined' && console.log !== originalLog) {
                console.log = originalLog;
            }
            
            let stack = error.stack || error.message;
            if (window.POLYFILL_LINES) {
                stack = stack.replace(/<anonymous>:(\d+):(\d+)/g, (match, line, col) => {
                    const originalLine = Math.max(1, parseInt(line) - window.POLYFILL_LINES);
                    return `Line ${originalLine}:${col}`;
                });
            }
            reject(new Error(stack));
        }
    });
}

function transpileJavaToJS(javaCode) {
    // Simple Java to JavaScript transpiler
    let jsCode = javaCode;

    // Remove public/static keywords and class declaration
    jsCode = jsCode.replace(/public\s+class\s+\w+\s*\{/, '');
    jsCode = jsCode.replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)\s*\{/g, 'function main() {');
    jsCode = jsCode.replace(/(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|String|double|boolean|float|long|char|byte|short|[A-Z]\w*(?:<[^>]+>)?)(?:\[\s*\])?\s+(\w+)\s*\(/g, 'function $1(');

    // Replace Java-style method calls
    jsCode = jsCode.replace(/System\.out\.println\s*\(/g, 'console.log(');
    jsCode = jsCode.replace(/System\.out\.print\s*\(/g, 'console.log(');

    // Replace Java String methods with JavaScript equivalents
    jsCode = jsCode.replace(/\.length\(\)/g, '.length');
    jsCode = jsCode.replace(/\.charAt\s*\(([^)]+)\)/g, '[$1]');

    // Array initializations: new int[]{1, 2} -> [1, 2]
    jsCode = jsCode.replace(/new\s+\w+\[\s*\]\s*\{([^}]*)\}/g, '[$1]');

    // Enhanced for loop: for(int n : arr) -> for(let n of arr)
    jsCode = jsCode.replace(/for\s*\(\s*\w+(?:<[^>]+>)?\s+(\w+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

    // Remove generics like <Integer>, <String, Integer>, <>
    jsCode = jsCode.replace(/([A-Z]\w*)\s*<[^>]*>/g, '$1');

    // Strip types from function parameters
    jsCode = jsCode.replace(/function\s+\w+\s*\(([^)]*)\)/g, function(match, params) {
        let paramList = params.split(",").map(p => {
            p = p.trim();
            if (!p) return p;
            let parts = p.split(/\s+/);
            return parts[parts.length - 1]; // return the variable name
        });
        return match.replace(params, paramList.join(", "));
    });

    // Remove remaining `public`, `private`, `protected`, and `static` keywords
    jsCode = jsCode.replace(/\b(?:public|private|protected|static)\s+/g, '');

    // Variable declarations with types (including capital letters like Set, List, Map, Integer)
    jsCode = jsCode.replace(/\b([A-Z]\w*|[a-z]\w*(?:\[\s*\])?)\s+(\w+)\s*(={1}|;)/g, function(match, type, name, ending) {
        if (['return', 'new', 'else', 'throw'].includes(type)) return match;
        return `let ${name} ${ending}`;
    });

    // Remove the last closing brace of the class
    const lastBraceIndex = jsCode.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
        jsCode = jsCode.substring(0, lastBraceIndex) + jsCode.substring(lastBraceIndex + 1);
    }

    // Add main() call at the end
    jsCode += '\nmain();';

    const polyfills = `
class HashSet extends Set {
    add(val) { super.add(val); return true; }
    contains(val) { return super.has(val); }
    remove(val) { return super.delete(val); }
    isEmpty() { return super.size === 0; }
}

class HashMap extends Map {
    put(key, val) { super.set(key, val); return val; }
    get(key) { return super.get(key); }
    containsKey(key) { return super.has(key); }
    remove(key) { return super.delete(key); }
    isEmpty() { return super.size === 0; }
    keySet() { return Array.from(super.keys()); }
    values() { return Array.from(super.values()); }
}

class ArrayList extends Array {
    add(val) { super.push(val); return true; }
    get(index) { return this[index]; }
    set(index, val) { this[index] = val; }
    remove(index) { return this.splice(index, 1)[0]; }
    size() { return this.length; }
    isEmpty() { return this.length === 0; }
}
`;
    // Store polyfill offset: lines in polyfill string - 1 (for first empty line) + 2 (Function wrapper offset)
    window.POLYFILL_LINES = polyfills.split('\n').length + 1;

    return polyfills + '\n' + jsCode;
}

function displayOutput(output) {
    const outputEl = document.getElementById('output');
    outputEl.textContent = output;
}

function displayError(error) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = error;
    errorEl.classList.add('active');
}