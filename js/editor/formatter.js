import { getEditor } from './editor.js';
import { logger } from '../utils/logger.js';
import { telemetry } from '../utils/telemetry.js';
import { autoImport } from './autoImport.js';

export function formatCode() {
    const editor = getEditor();
    if (!editor) return;

    logger.debug('Formatting code triggered');
    const code = autoImport(editor.getValue());
    let formatted = '';
    let indentLevel = 0;
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.length === 0) {
            formatted += '\n';
            continue;
        }
        
        if (line.match(/^}/) || line.match(/^[}\]]/)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        formatted += '    '.repeat(indentLevel) + line + '\n';
        
        if (line.match(/\{$/) || line.match(/\[$/)) {
            indentLevel++;
        }
    }
    
    editor.executeEdits('format', [{
        range: editor.getModel().getFullModelRange(),
        text: formatted.replace(/\n$/, '')
    }]);

    telemetry.track('code_formatted');
    logger.info('Code formatted successfully');
}
