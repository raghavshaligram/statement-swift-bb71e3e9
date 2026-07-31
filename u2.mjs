import { chromium } from "/home/claude/.npm-global/lib/node_modules/playwright/index.mjs";
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1280,height:900} });
const errs=[]; p.on("pageerror",e=>errs.push(e.message));

// Get Pro (signed out) must carry the destination through to sign-in
await p.goto("http://127.0.0.1:7200/", {waitUntil:"load",timeout:25000});
await p.waitForTimeout(9000);
await p.evaluate(async()=>{ for(let i=0;i<30;i++){window.scrollBy(0,600);await new Promise(r=>setTimeout(r,110));} });
await p.waitForTimeout(1500);
await p.locator('a:has-text("Get Pro")').first().click();
await p.waitForTimeout(3000);
console.log("1. Get Pro ->", p.url());
console.log("2. carries redirect to billing:", p.url().includes("redirect") && p.url().includes("billing"));

// the stash used by the OAuth path should be written when Google is used
await p.evaluate(()=>sessionStorage.clear());
const before = await p.evaluate(()=>sessionStorage.getItem("ledgerlocal.postAuthRedirect"));
await p.locator('button:has-text("Continue with Google")').first().click().catch(()=>{});
await p.waitForTimeout(2000);
const after = await p.evaluate(()=>sessionStorage.getItem("ledgerlocal.postAuthRedirect"));
console.log("3. destination stashed before OAuth:", before, "->", after);

console.log("errors:", errs.filter(e=>!e.includes("403")).slice(0,2));
await b.close();
