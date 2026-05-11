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

        // Check statements that should always end with a semicolon
        if (line.startsWith('System.out') || 
            line.match(/^(int|String|boolean|double|float|long|char|byte|short)\s+[a-zA-Z_]/) || 
            line.startsWith('return ') || 
            line === 'break' || 
            line === 'continue' ||
            line.match(/^[a-zA-Z_][a-zA-Z0-9_]*(?:\[.*\])?\s*=(?!=)/)) {
            
            if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith(',')) {
                return `Line ${i + 1}: Missing semicolon (;)\n  > ${lines[i].trim()}`;
            }
        }
        
        // Check simple method calls (like solution())
        if (line.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(/)) {
            if (!line.endsWith('{') && !line.endsWith(';')) {
                return `Line ${i + 1}: Missing semicolon (;)\n  > ${lines[i].trim()}`;
            }
        }
    }
    return null;
}

export function transpileJavaToJS(javaCode) {
    logger.debug('Starting transpilation of Java code');
    let jsCode = javaCode;

    jsCode = jsCode.replace(/public\s+class\s+\w+\s*\{/, '');
    jsCode = jsCode.replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)\s*\{/g, 'function main() {');
    jsCode = jsCode.replace(/(?:public\s+|private\s+|protected\s+|static\s+)*(?:void|int|String|double|boolean|float|long|char|byte|short|[A-Z]\w*(?:<[^>]+>)?)(?:\[\s*\])?\s+(\w+)\s*\(/g, 'function $1(');

    jsCode = jsCode.replace(/System\.out\.println\s*\(/g, 'console.log(');
    jsCode = jsCode.replace(/System\.out\.print\s*\(/g, 'console.log(');

    jsCode = jsCode.replace(/\.length\(\)/g, '.length');
    jsCode = jsCode.replace(/\.charAt\s*\(([^)]+)\)/g, '[$1]');

    jsCode = jsCode.replace(/new\s+\w+\[\s*\]\s*\{([^}]*)\}/g, '[$1]');

    jsCode = jsCode.replace(/for\s*\(\s*\w+(?:<[^>]+>)?\s+(\w+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

    jsCode = jsCode.replace(/([A-Z]\w*)\s*<[^>]*>/g, '$1');

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

    jsCode = jsCode.replace(/\b([A-Z]\w*|[a-z]\w*(?:\[\s*\])?)\s+(\w+)\s*(={1}|;)/g, function(match, type, name, ending) {
        if (['return', 'new', 'else', 'throw'].includes(type)) return match;
        return `let ${name} ${ending}`;
    });

    const lastBraceIndex = jsCode.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
        jsCode = jsCode.substring(0, lastBraceIndex) + jsCode.substring(lastBraceIndex + 1);
    }

    jsCode += '\nmain();';

    window.POLYFILL_LINES = JAVA_POLYFILLS.split('\n').length + 1;
    logger.debug(`Transpilation complete. Polyfill offset: ${window.POLYFILL_LINES} lines.`);

    return JAVA_POLYFILLS + '\n' + jsCode;
}
