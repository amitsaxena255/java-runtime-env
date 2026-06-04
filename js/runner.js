import { validateJavaCode, enforceSemicolons, transpileJavaToJS } from './transpiler/index.js';
import { logger } from './utils/logger.js';
import { telemetry } from './utils/telemetry.js';

export async function executeJava(code, isDebug = false) {
    logger.info('Starting Java execution');
    telemetry.track('code_run_started', { length: code.length });

    window.LINE_MAP = buildLineMap(code);

    return new Promise(async (resolve, reject) => {
        let originalLog;
        try {
            const hasClass = /public\s+class\s+\w+/.test(code);
            const hasMain = /public\s+static\s+void\s+main\s*\(\s*String\[\]\s+\w+\s*\)/.test(code);

            if (!hasClass) {
                telemetry.track('code_run_failed', { reason: 'no_public_class' });
                throw new Error('Invalid Java code structure. Please ensure you have a public class.');
            }

            if (!hasMain) {
                const semicolonError = enforceSemicolons(code);
                if (semicolonError) {
                    telemetry.track('code_run_failed', { reason: 'missing_semicolon' });
                    throw new Error('Syntax Error: ' + semicolonError);
                }

                const jsCode = transpileJavaToJS(code, false, isDebug);
                const func = new Function(jsCode);
                const result = func();
                if (result instanceof Promise) {
                    await result;
                }
                telemetry.track('code_run_failed', { reason: 'no_main_method_syntactically_correct' });
                throw new Error('There is no main method, but the code is syntactically correct.');
            }

            const semicolonError = enforceSemicolons(code);
            if (semicolonError) {
                telemetry.track('code_run_failed', { reason: 'missing_semicolon' });
                throw new Error('Syntax Error: ' + semicolonError);
            }

            const jsCode = transpileJavaToJS(code, true, isDebug);
            const output = [];
            originalLog = console.log;
            
            console.log = (...args) => {
                output.push(args.join(' '));
            };

            if (typeof originalLog !== 'undefined') {
                originalLog("DEBUG JSCODE:\n" + jsCode);
            }
            const func = new Function(jsCode);
            const result = func();
            if (result instanceof Promise) {
                await result;
            }

            console.log = originalLog;
            telemetry.track('code_run_success', { outputLength: output.length });
            resolve(output.length > 0 ? output.join('\n') : '(No output)');

        } catch (error) {
            if (typeof originalLog !== 'undefined' && console.log !== originalLog) {
                console.log = originalLog;
            }
            
            let stack = error.stack || error.message;
            if (window.POLYFILL_LINES) {
                stack = stack.replace(/<anonymous>:(\d+):(\d+)/g, (match, line, col) => {
                    const combinedLine = Math.max(1, parseInt(line) - window.POLYFILL_LINES);
                    if (window.LINE_MAP && window.LINE_MAP[combinedLine]) {
                        const mapping = window.LINE_MAP[combinedLine];
                        if (mapping.file) {
                            return `${mapping.file}:Line ${mapping.line}:${col}`;
                        }
                    }
                    return `Line ${combinedLine}:${col}`;
                });
            }
            logger.error('Runtime error during execution', error);
            telemetry.track('code_run_failed', { reason: 'runtime_error', message: error.message });
            reject(new Error(stack));
        }
    });
}

function buildLineMap(combinedCode) {
    const lines = combinedCode.split('\n');
    const map = {};
    let currentFile = null;
    let fileLineNum = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/\/\*\s*FILE:\s*([\w.]+)\s*\*\//);
        if (match) {
            currentFile = match[1];
            fileLineNum = 0;
            map[i + 1] = { file: null, line: 0 };
        } else {
            if (currentFile) {
                fileLineNum++;
                map[i + 1] = { file: currentFile, line: fileLineNum };
            } else {
                map[i + 1] = { file: null, line: 0 };
            }
        }
    }
    return map;
}
