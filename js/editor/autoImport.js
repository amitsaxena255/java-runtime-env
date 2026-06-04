export function autoImport(code) {
    const IMPORT_MAPPINGS = {
        'Map': 'import java.util.Map;',
        'HashMap': 'import java.util.HashMap;',
        'List': 'import java.util.List;',
        'ArrayList': 'import java.util.ArrayList;',
        'Set': 'import java.util.Set;',
        'HashSet': 'import java.util.HashSet;',
        'Iterator': 'import java.util.Iterator;',
        'Arrays': 'import java.util.Arrays;',
        'Collections': 'import java.util.Collections;'
    };

    const lines = code.split('\n');
    const importLines = [];
    const nonImportLines = [];

    // Separate existing imports from the rest of the code
    for (const line of lines) {
        if (line.trim().startsWith('import ')) {
            importLines.push(line);
        } else {
            nonImportLines.push(line);
        }
    }

    const nonImportCode = nonImportLines.join('\n');
    const addedImports = new Set();

    for (const [className, importStatement] of Object.entries(IMPORT_MAPPINGS)) {
        // Check if the class is used in the non-import code as a word boundary
        const classRegex = new RegExp('\\b' + className + '\\b');
        if (classRegex.test(nonImportCode)) {
            // Check if this import or wildcard utility import is already present
            const alreadyImported = importLines.some(imp => {
                const trimmed = imp.trim();
                return trimmed === importStatement || 
                       trimmed === 'import java.util.*;' ||
                       trimmed.replace(/\s+/g, '') === importStatement.replace(/\s+/g, '');
            });

            if (!alreadyImported) {
                addedImports.add(importStatement);
            }
        }
    }

    if (addedImports.size === 0) {
        return code; // no changes
    }

    // Prepend the new imports to the existing imports
    const allImports = [...importLines, ...Array.from(addedImports)];
    
    // Clean up empty lines between imports and code
    let remainingCode = nonImportCode;
    while (remainingCode.startsWith('\n')) {
        remainingCode = remainingCode.substring(1);
    }

    return allImports.join('\n') + '\n\n' + remainingCode;
}
