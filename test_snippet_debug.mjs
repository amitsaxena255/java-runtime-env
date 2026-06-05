import { chromium } from 'playwright';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = exec('python3 -m http.server 8000', { cwd: __dirname });

setTimeout(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log('BROWSER CONSOLE:', msg.text());
        });
        page.on('pageerror', err => console.error('BROWSER PAGE ERROR:', err.message));
        
        console.log("Navigating to Oasis IDE...");
        await page.goto('http://localhost:8000/index.html');
        await page.waitForTimeout(2000);
        
        console.log("Clearing localStorage...");
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        await page.waitForTimeout(2000);
        
        console.log("Selecting template Graph BFS...");
        await page.selectOption('#templateSelector', 'Graph BFS');
        await page.waitForTimeout(500);
        
        console.log("Running...");
        await page.click('#runBtn');
        await page.waitForTimeout(2000);
        
        const output = await page.textContent('#output');
        console.log("Output Console:\n", output.trim());
        
        await browser.close();
        server.kill();
        process.exit(0);
    } catch (e) {
        console.error("Test failed:", e);
        if (browser) await browser.close();
        server.kill();
        process.exit(1);
    }
}, 2000);
