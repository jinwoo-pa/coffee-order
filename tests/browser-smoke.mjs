// Optional browser check: set PLAYWRIGHT_MODULE to an installed playwright package.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const appUrl=process.env.APP_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('output/playwright',{recursive:true});
await page.goto(appUrl);
await page.screenshot({path:'output/playwright/mobile-entry.png',fullPage:true});
assert.equal(await page.locator('#complete').isDisabled(),true);
async function add(name,coffee,temp,size){await page.locator('#name').fill(name);await page.locator('#coffee').selectOption(coffee);await page.locator(`input[value="${temp}"]`).check();await page.locator('#size').selectOption(size);await page.locator('#add-order').click();}
await add('민수','아메리카노','ICE','기본');await add('지영','아메리카노','ICE','기본');await add('민수','아메리카노','HOT','크게');
await page.reload();assert.equal(await page.locator('.order-row').count(),3);
await page.locator('#complete').click();assert.equal(await page.locator('#result-view').isVisible(),true);
assert.equal(await page.locator('.person').count(),2);assert.equal(await page.locator('.cafe-row').count(),2);assert.ok((await page.locator('#cafe-list').innerText()).includes('2잔'));
await page.reload();assert.equal(await page.locator('#result-view').isVisible(),true);assert.ok((await page.locator('#personal-list').innerText()).includes('민수'));
for(const width of [320,390,430,768]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}`);}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'output/playwright/mobile-result.png',fullPage:true});
await context.grantPermissions(['clipboard-read','clipboard-write']);await page.locator('#copy').click();const copied=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(copied.includes('총 3잔'));assert.ok(!copied.includes('민수'));
await context.clearPermissions();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(Error('denied'))},configurable:true}));await page.locator('#copy').click();assert.equal(await page.locator('#copy-fallback').isVisible(),true);
await page.locator('#modify').click();await page.locator('[data-action="edit"]').first().click();await page.locator('#size').selectOption('작게');await page.locator('#add-order').click();assert.ok((await page.locator('.order-row').first().innerText()).includes('작게'));
await page.locator('[data-action="delete"]').last().click();assert.equal(await page.locator('.order-row').count(),2);
await page.locator('summary').click();await page.locator('#choice-name').fill(' 콜드브루 ');await page.locator('#choice-form button').click();assert.equal(await page.locator('#coffee').inputValue(),'콜드브루');
await page.locator('#choice-name').fill('콜드브루');await page.locator('#choice-form button').click();assert.equal(await page.locator('#choice-error').isVisible(),true);
await page.locator('#complete').click();await page.locator('#new-order').click();await page.locator('#dialog-cancel').click();assert.equal(await page.locator('#result-view').isVisible(),true);await page.reload();assert.equal(await page.locator('#result-view').isVisible(),true);
await page.locator('#new-order').click();await page.locator('#dialog-confirm').click();assert.equal(await page.locator('.order-row').count(),0);assert.equal(await page.locator('#coffee option').filter({hasText:'콜드브루'}).count(),1);
await add('이름 <script>','콜드브루','ICE','기본');assert.ok((await page.locator('#order-list').innerText()).includes('<script>'));
await page.locator('#delete-orders').click();await page.locator('#dialog-cancel').click();assert.equal(await page.locator('.order-row').count(),1);await page.locator('#delete-orders').click();await page.locator('#dialog-confirm').click();assert.equal(await page.locator('.order-row').count(),0);
await page.locator('#reset').click();await page.locator('#dialog-cancel').click();assert.equal(await page.locator('#coffee option').filter({hasText:'콜드브루'}).count(),1);await page.locator('#reset').click();await page.locator('#dialog-confirm').click();assert.equal(await page.locator('#coffee option').filter({hasText:'콜드브루'}).count(),0);
const failContext=await browser.newContext();await failContext.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('quota')};});const failPage=await failContext.newPage();await failPage.goto('http://127.0.0.1:4173');await failPage.locator('#name').fill('저장실패');await failPage.locator('#coffee').selectOption('아메리카노');await failPage.locator('input[value="ICE"]').check();await failPage.locator('#size').selectOption('기본');await failPage.locator('#add-order').click();assert.equal(await failPage.locator('#storage-warning').isVisible(),true);assert.equal(await failPage.locator('.order-row').count(),1);
assert.deepEqual(errors,[]);await browser.close();console.log('Browser checks passed: entry, grouping, reload, editing, copying, confirmations, reset, storage failure, 320–768px layout.');
