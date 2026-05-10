import { chromium } from 'playwright';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = exec('python3 -m http.server 8081', { cwd: __dirname });

setTimeout(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
        
        console.log("Navigating to Oasis IDE...");
        await page.goto('http://localhost:8081/index.html');
        await page.waitForTimeout(2000); // let monaco load
        
        // Check if editor is editable by typing into it
        console.log("Typing into editor...");
        // Click on the monaco editor to focus it
        await page.click('.monaco-editor');
        await page.keyboard.type('// test typing');
        
        await page.waitForTimeout(1000);
        
        // Extract text from Monaco
        const code = await page.evaluate(() => {
            return window.monaco.editor.getModels()[0].getValue();
        });
        console.log("Code inside Monaco after typing:\n" + code);
        
        // Try running code
        console.log("Clicking run...");
        await page.click('#runBtn');
        await page.waitForTimeout(1000);
        
        const output = await page.textContent('#output');
        console.log("Output Console Text:\n" + output);
        
        await browser.close();
        server.kill();
        process.exit(0);
    } catch (e) {
        console.error(e);
        if (browser) await browser.close();
        server.kill();
        process.exit(1);
    }
}, 2000);
