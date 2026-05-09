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
        theme: 'vs-dark',
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

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);
}

function saveCode() {
    const code = editor.getValue();
    localStorage.setItem('javaCode', code);
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
            reject(new Error(`Runtime Error: ${error.message}`));
        }
    });
}

function transpileJavaToJS(javaCode) {
    // Simple Java to JavaScript transpiler
    let jsCode = javaCode;

    // Remove public/static keywords and class declaration
    jsCode = jsCode.replace(/public\s+class\s+\w+\s*\{/, '(function() {');
    jsCode = jsCode.replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)\s*\{/g, 'function main() {');
    jsCode = jsCode.replace(/static\s+void\s+(\w+)\s*\(/g, 'function $1(');
    jsCode = jsCode.replace(/static\s+int\s+(\w+)\s*\(/g, 'function $1(');
    jsCode = jsCode.replace(/static\s+String\s+(\w+)\s*\(/g, 'function $1(');

    // Replace Java-style method calls
    jsCode = jsCode.replace(/System\.out\.println\s*\(/g, 'console.log(');
    jsCode = jsCode.replace(/System\.out\.print\s*\(/g, 'console.log(');

    // Replace Java String methods with JavaScript equivalents
    jsCode = jsCode.replace(/\.length\(\)/g, '.length');
    jsCode = jsCode.replace(/\.charAt\s*\(/g, '[');

    // Handle int, String, double, etc. declarations
    jsCode = jsCode.replace(/\b(int|String|double|boolean|float|long)\s+/g, 'let ');

    // Add main() call at the end
    jsCode += '\nmain();';

    // Wrap in function
    jsCode += '\n})()';

    return jsCode;
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