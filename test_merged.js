const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.HOME + '/.cache/ms-playwright/chromium_headless_shell-1217/chrome-linux/headless_shell' });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));
    await page.goto('file:///home/z/Desktop/ai_capacity_study/ai_capacity_standalone.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('=== INDEX ===');
    console.log('Title:', await page.title());
    console.log('Index visible:', await page.isVisible('#view-index'));
    console.log('Cards:', await page.locator('.module-card').count());
    
    console.log('\n=== MODULE 01 ===');
    await page.evaluate(() => document.querySelectorAll('.module-card')[0].click()); await page.waitForTimeout(500);
    console.log('M01 active:', await page.isVisible('#view-01.active'));
    console.log('M01 intro:', await page.isVisible('#m1-intro'));
    await page.locator('text=进入案例展示').first().click({ force: true }); await page.waitForTimeout(500);
    const gDisplay = await page.$eval('#m1-gallery', el => el.style.display);
    console.log('M01 gallery display:', gDisplay);
    
    console.log('\n=== BACK TO INDEX ===');
    await page.evaluate(() => document.querySelector('#view-01 .back-btn').click()); await page.waitForTimeout(500);
    console.log('Index visible again:', await page.isVisible('#view-index'));
    
    console.log('\n=== MODULE 02 ===');
    await page.evaluate(() => document.querySelectorAll('.module-card')[1].click()); await page.waitForTimeout(500);
    console.log('M02 active:', await page.isVisible('#view-02.active'));
    const m2TabsVisible = await page.locator('.m2-tab').count();
    console.log('M02 tabs count:', m2TabsVisible);
    
    console.log('\n=== MODULE 03 ===');
    await page.evaluate(() => document.querySelector('#view-02 .back-btn').click()); await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll('.module-card')[2].click()); await page.waitForTimeout(500);
    console.log('M03 active:', await page.isVisible('#view-03.active'));
    console.log('M03 tech visible:', await page.isVisible('#m3-tech-view'));
    const mapBtnVisible = await page.isVisible('text=进入交互地图');
    console.log('M03 map btn visible:', mapBtnVisible);
    
    console.log('\n=== MODULE 04 ===');
    await page.evaluate(() => document.querySelector('#view-03 .back-btn').click()); await page.waitForTimeout(500);
    await page.evaluate(() => document.querySelectorAll('.module-card')[3].click()); await page.waitForTimeout(500);
    console.log('M04 active:', await page.isVisible('#view-04.active'));
    console.log('M04 slides:', await page.locator('[data-slide]').count());
    
    if (errors.length > 0) { console.log('\nCONSOLE ERRORS:'); errors.slice(0,5).forEach(e => console.log('  ', e.substring(0,200))); }
    else { console.log('\nNo console errors!'); }
    await browser.close(); console.log('\nDONE');
})().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
