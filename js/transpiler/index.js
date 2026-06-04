import { JAVA_POLYFILLS } from './polyfills.js';
import { logger } from '../utils/logger.js';

export function validateJavaCode(code) {
    const hasClass = /public\s+class\s+\w+/.test(code);
    const hasMain = /public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)/.test(code);
    return hasClass && hasMain;
}

export function enforceSemicolons(code) {
    const lines = code.split('\n');
    let insideComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (line.startsWith('/*')) insideComment = true;
        if (line.endsWith('*/')) { insideComment = false; continue; }
        if (insideComment || line.startsWith('//') || line === '') continue;

        // Strip trailing comments for semicolon checking
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex).trim();
        }

        // Check statements that should always end with a semicolon
        if (line.startsWith('System.out') || 
            line.match(/^(int|String|boolean|double|float|long|char|byte|short)\s+[a-zA-Z_]/) || 
            line.startsWith('return ') || 
            line === 'break' || 
            line === 'continue' ||
            line.match(/^[a-zA-Z_][a-zA-Z0-9_]*(?:\[.*\])?\s*=(?!=)/)) {
            
            if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith(',') && !line.endsWith('}')) {
                return `Line ${i + 1}: Missing semicolon (;)\n  > ${lines[i].trim()}`;
            }
        }
        
        // Check simple method calls (like solution())
        if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
            if (!line.endsWith('{') && !line.endsWith(';') && !line.endsWith('}')) {
                return `Line ${i + 1}: Missing semicolon (;)\n  > ${lines[i].trim()}`;
            }
        }
    }
    return null;
}

export function transpileJavaToJS(javaCode, appendMain = true, isDebug = false) {
    logger.debug('Starting transpilation of Java code');
    let jsCode = javaCode;

    // Scan for all classes and their methods
    const classes = [];
    const classRegex = /\bclass\s+(\w+)/g;
    let match;
    const replacements = [];
    
    // Create a copy of code where comments and string literals are blanked out to match braces correctly
    let commentStripped = javaCode
        .replace(/\/\*([\s\S]*?)\*\//g, (m, p1) => '/*' + p1.replace(/[^\n]/g, ' ') + '*/')
        .replace(/\/\/[^\n]*/g, (m) => '//' + ' '.repeat(m.length - 2))
        .replace(/"([^"\\]|\\.)*"/g, (m) => '"' + ' '.repeat(m.length - 2) + '"')
        .replace(/'([^'\\]|\\.)*'/g, (m) => "'" + ' '.repeat(m.length - 2) + "'");

    while ((match = classRegex.exec(commentStripped)) !== null) {
        const className = match[1];
        const classIndex = match.index;
        
        let startDecl = classIndex;
        while (startDecl > 0 && /\s/.test(commentStripped[startDecl - 1])) {
            startDecl--;
        }
        
        const prefixMatch = commentStripped.substring(Math.max(0, startDecl - 20), startDecl).match(/\b(public|private|protected)\s*$/);
        if (prefixMatch) {
            startDecl -= prefixMatch[0].length;
        }
        
        const openBraceIndex = commentStripped.indexOf('{', classIndex);
        if (openBraceIndex === -1) continue;
        
        let braceCount = 1;
        let closeBraceIndex = -1;
        for (let i = openBraceIndex + 1; i < commentStripped.length; i++) {
            if (commentStripped[i] === '{') braceCount++;
            else if (commentStripped[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    closeBraceIndex = i;
                    break;
                }
            }
        }
        
        if (closeBraceIndex !== -1) {
            const classBody = commentStripped.substring(openBraceIndex + 1, closeBraceIndex);
            
            const methodNames = [];
            const methodRegex = /(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|String|double|boolean|float|long|char|byte|short|[A-Z]\w*(?:<[^>]+>)?)(?:\[\s*\])?\s+(\w+)\s*\(/g;
            let methodMatch;
            while ((methodMatch = methodRegex.exec(classBody)) !== null) {
                const methodName = methodMatch[1];
                if (methodName !== 'System' && methodName !== 'Math' && methodName !== className) {
                    methodNames.push(methodName);
                }
            }
            
            classes.push({
                name: className,
                methods: methodNames
            });
            
            replacements.push({ start: startDecl, end: openBraceIndex + 1 });
            replacements.push({ start: closeBraceIndex, end: closeBraceIndex + 1 });
        }
    }

    // Apply replacements to jsCode to strip all class wrappers
    replacements.sort((a, b) => b.start - a.start);
    for (const rep of replacements) {
        const before = jsCode.substring(0, rep.start);
        const originalText = jsCode.substring(rep.start, rep.end);
        const replacedText = originalText.replace(/[^\n]/g, ' ');
        const after = jsCode.substring(rep.end);
        jsCode = before + replacedText + after;
    }

    // Blank out comments in jsCode to avoid matching Java constructs inside comments, while preserving line numbers.
    jsCode = jsCode.replace(/\/\*([\s\S]*?)\*\//g, (match, p1) => {
        return '/*' + p1.replace(/[^\n]/g, ' ') + '*/';
    });
    jsCode = jsCode.replace(/\/\/[^\n]*/g, (match) => {
        return '//' + ' '.repeat(match.length - 2);
    });

    // Stash string literals to protect them from regex replacements
    const stringStash = [];
    jsCode = jsCode.replace(/"([^"\\]|\\.)*"/g, (match) => {
        const placeholder = `__STR_LITERAL_${stringStash.length}__`;
        stringStash.push(match);
        return placeholder;
    });
    jsCode = jsCode.replace(/'([^'\\]|\\.)*'/g, (match) => {
        const placeholder = `__STR_LITERAL_${stringStash.length}__`;
        stringStash.push(match);
        return placeholder;
    });

    // Strip Java import statements
    jsCode = jsCode.replace(/\bimport\s+[^;\n]+;?/g, '');

    // Extract user method names to prepended await calls in debug mode
    const methodNames = [];
    if (isDebug) {
        const methodRegex = /(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|String|double|boolean|float|long|char|byte|short|[A-Z]\w*(?:<[^>]+>)?)(?:\[\s*\])?\s+(\w+)\s*\(/g;
        let match;
        while ((match = methodRegex.exec(javaCode)) !== null) {
            if (match[1] !== 'main' && match[1] !== 'System' && match[1] !== 'Math') {
                methodNames.push(match[1]);
            }
        }
    }

    if (isDebug) {
        // Instrument lines with debug pauses
        const lines = jsCode.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const isExecutable = line.endsWith(';') || 
                                 line.startsWith('if') || 
                                 line.startsWith('for') || 
                                 line.startsWith('while') || 
                                 line.startsWith('do') || 
                                 line.startsWith('switch') || 
                                 line.startsWith('return');
            const isStructural = line.startsWith('import') || 
                                 line.startsWith('public class') || 
                                 line.startsWith('class') || 
                                 line.startsWith('//') || 
                                 line.startsWith('/*') || 
                                 line.startsWith('*') || 
                                 line.startsWith('package');
            
            if (isExecutable && !isStructural) {
                lines[i] = `await window.debugLine(${i + 1}); ` + lines[i];
            }
        }
        jsCode = lines.join('\n');
    }

    const funcPrefix = isDebug ? 'async function' : 'function';

    // Transpile constructors (e.g. TreeNode(int val) { -> function TreeNode(int val) {)
    jsCode = jsCode.replace(/\b(?:public|private|protected\s+)?([A-Z]\w*)\s*\(([^)]*)\)\s*\{/g, 'function $1($2) {');

    jsCode = jsCode.replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)\s*\{/g, `${funcPrefix} main() {`);
    jsCode = jsCode.replace(/(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|String|double|boolean|float|long|char|byte|short|[A-Z]\w*(?:<[^>]+>)?)(?:\[\s*\])?\s+(\w+)\s*\(/g, `${funcPrefix} $1(`);

    jsCode = jsCode.replace(/System\.out\.println\s*\(/g, 'console.log(');
    jsCode = jsCode.replace(/System\.out\.print\s*\(/g, 'console.log(');

    jsCode = jsCode.replace(/\.length\(\)/g, '.length');
    jsCode = jsCode.replace(/\.charAt\s*\(([^)]+)\)/g, '[$1]');

    jsCode = jsCode.replace(/new\s+\w+\[\s*\]\s*\{([^}]*)\}/g, '[$1]');
    jsCode = jsCode.replace(/new\s+(?:int|double|float|long|short|byte|char|boolean|String|[A-Z]\w*(?:\.[A-Z]\w*)*)\s*\[([^\]]+)\]/g, 'new Array($1).fill(0)');

    // Support dot-separated types in enhanced for loops (e.g. Map.Entry)
    jsCode = jsCode.replace(/for\s*\(\s*[\w.]+(?:<[^>]+>)?\s+(\w+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

    // Recursively strip nested generics (e.g. Iterator<Map.Entry<String, String>>)
    while (true) {
        let prev = jsCode;
        jsCode = jsCode.replace(/([A-Z]\w*)\s*<[^<>]*>/g, '$1');
        if (jsCode === prev) break;
    }

    // Strip Java exception types from catch blocks
    jsCode = jsCode.replace(/catch\s*\(\s*[\w.|<>\[\]]+\s+(\w+)\s*\)/g, 'catch ($1)');

    jsCode = jsCode.replace(/function\s+\w+\s*\(([^)]*)\)/g, function(match, params) {
        let paramList = params.split(",").map(p => {
            p = p.trim();
            if (!p) return p;
            let parts = p.split(/\s+/);
            return parts[parts.length - 1]; 
        });
        return match.replace(params, paramList.join(", "));
    });

    jsCode = jsCode.replace(/\b(?:public|private|protected|static)\s+/g, '');

    // Strip Java typecasts (e.g. (int) to Math.floor)
    jsCode = jsCode.replace(/\(int\)\s*\(([^)]+)\)/g, 'Math.floor($1)');
    jsCode = jsCode.replace(/\(int\)\s*([a-zA-Z0-9_.]+)/g, 'Math.floor($1)');

    // Support Java variable and field declarations (including comma-separated lists)
    jsCode = jsCode.replace(/\b(?:int|double|boolean|char|float|long|short|byte|String|[A-Z]\w*(?:\.[A-Z]\w*)*)(?:\[\s*\])?\s+([a-zA-Z_]\w*[^;]*);/g, 'var $1;');

    // Create namespaces for classes to map static methods
    let namespaceCode = '';
    for (const cls of classes) {
        namespaceCode += `\nif (typeof ${cls.name} === 'undefined') { var ${cls.name} = function() {}; }\n`;
        for (const method of cls.methods) {
            namespaceCode += `${cls.name}.${method} = ${method};\n`;
        }
    }
    jsCode += '\n' + namespaceCode;

    if (isDebug) {
        // Prepend await to user method calls
        for (const methodName of ['main', ...methodNames]) {
            const callRegex = new RegExp(`(?<!async\\s+function\\s+)(?<!await\\s+)\\b(${methodName})\\s*\\(`, 'g');
            jsCode = jsCode.replace(callRegex, 'await $1(');
        }
    }

    if (appendMain) {
        jsCode += isDebug ? '\nawait main();' : '\nmain();';
    }

    // Restore stashed string literals
    for (let i = 0; i < stringStash.length; i++) {
        jsCode = jsCode.replace(`__STR_LITERAL_${i}__`, () => stringStash[i]);
    }

    window.POLYFILL_LINES = JAVA_POLYFILLS.split('\n').length + 1;
    logger.debug(`Transpilation complete. Polyfill offset: ${window.POLYFILL_LINES} lines.`);

    if (isDebug) {
        // Wrap everything in an async IIFE for top-level await support
        return `return (async () => {
${JAVA_POLYFILLS}
${jsCode}
})();`;
    }

    return JAVA_POLYFILLS + '\n' + jsCode;
}
