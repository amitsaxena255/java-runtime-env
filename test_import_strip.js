const fs = require('fs');
const path = require('path');

// Read polyfills.js
const polyfillsPath = path.resolve(__dirname, 'js/transpiler/polyfills.js');
let polyfillsContent = fs.readFileSync(polyfillsPath, 'utf8')
    .replace(/export\s+const\s+JAVA_POLYFILLS\s*=/, 'const JAVA_POLYFILLS =');

// Read index.js (the transpiler)
const transpilerPath = path.resolve(__dirname, 'js/transpiler/index.js');
let transpilerContent = fs.readFileSync(transpilerPath, 'utf8');

// Strip ES exports to evaluate it in Node.js
transpilerContent = transpilerContent
    .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];/gm, '') // remove ES6 imports
    .replace(/export\s+function/g, 'function')
    .replace(/export\s+const/g, 'const');

// Mock browser globals for transpiler
const window = { POLYFILL_LINES: 0 };
const logger = { debug: () => {}, info: () => {}, error: () => {} };

// Evaluate the transpiler code along with polyfills definition
const context = {};
const transpilerFunction = new Function('window', 'logger', 'exports', polyfillsContent + '\n' + transpilerContent + '\nexports.transpileJavaToJS = transpileJavaToJS;');
transpilerFunction(window, logger, context);
const transpileJavaToJS = context.transpileJavaToJS;

// Read autoImport.js
const autoImportPath = path.resolve(__dirname, 'js/editor/autoImport.js');
let autoImportContent = fs.readFileSync(autoImportPath, 'utf8')
    .replace(/export\s+function/g, 'function');
autoImportContent += '\nexports.autoImport = autoImport;';
const autoImportCtx = {};
new Function('exports', autoImportContent)(autoImportCtx);
const autoImport = autoImportCtx.autoImport;

// Read SNIPPETS
const snippetsPath = path.resolve(__dirname, 'js/editor/snippets.js');
let snippetsContent = fs.readFileSync(snippetsPath, 'utf8')
    .replace(/^import\s+[\s\S]*?from\s+['"].*?['"];/gm, '') // remove ES6 imports
    .replace(/export\s+const/g, 'const')
    .replace(/export\s+function[\s\S]*$/, '');
snippetsContent += '\nexports.SNIPPETS = SNIPPETS;';
const snippetsCtx = {};
new Function('exports', snippetsContent)(snippetsCtx);
const SNIPPETS = snippetsCtx.SNIPPETS;

// Simulate Graph BFS injection and auto-import
const javaCode = `public class Solution {
    public static void main(String[] args) {
        solution();
    }
    public static void solution() {
        System.out.println("Welcome to Oasis IDE!");
    }
    ${SNIPPETS['Graph BFS']}
}`;

const importedCode = autoImport(javaCode);
console.log("--- Code after Auto Import ---");
console.log(importedCode);

console.log("--- Transpiling ---");
const jsCode = transpileJavaToJS(importedCode, true, false);
console.log("--- Transpiled JS Code ---");
console.log(jsCode);

if (jsCode.includes('import')) {
    console.error("❌ ERROR: Transpiled code still contains import statements!");
} else {
    console.log("✅ SUCCESS: All import statements stripped successfully!");
}
