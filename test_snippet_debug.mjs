import { chromium } from 'playwright';

(async () => {
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
        
        console.log("Opening snippets...");
        await page.click('.tab-btn[data-tab="snippets"]');
        await page.waitForTimeout(500);
        
        console.log("Injecting Graph BFS...");
        await page.click('.snippet-btn[data-snippet="Graph BFS"]');
        await page.waitForTimeout(500);
        
        console.log("Running...");
        await page.click('#runBtn');
        await page.waitForTimeout(2000);
        
        const output = await page.textContent('#output');
        console.log("Output Console:\n", output.trim());
        
        await browser.close();
    } catch (e) {
        console.error("Test failed:", e);
        if (browser) await browser.close();
    }
})();
