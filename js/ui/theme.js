import { telemetry } from '../utils/telemetry.js';
import { getEditor } from '../editor/editor.js';

export function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        const body = document.body;
        body.classList.toggle('dark-theme');
        
        const isDark = body.classList.contains('dark-theme');
        toggleBtn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        telemetry.track('theme_toggled', { theme: isDark ? 'dark' : 'light' });
        
        const editor = getEditor();
        if (editor && window.monaco) {
            window.monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs');
        }
    });
}
