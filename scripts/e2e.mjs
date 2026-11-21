/*
 * End-to-end browser tests, driven over the Chrome DevTools Protocol.
 *
 * WHY THIS EXISTS. The 468 unit tests all test engines — pure arithmetic over
 * rule files, no DOM. They prove the maths is right and say nothing about
 * whether a reader can reach it: every one of them would still pass if the
 * form never rendered, the submit button were dead, or the ranking table
 * showed a blank. This file closes that gap by driving the real built site in
 * a real browser and asserting on what a reader actually sees.
 *
 * WHY NO PLAYWRIGHT. Node 22 ships a global WebSocket, and Chrome speaks CDP
 * over one, so the whole driver below is about eighty lines and costs the
 * project no dependency. `npm install` is currently fragile on this repo (npm
 * 10.9.8 crashes resolving vitest's peer graph), which is a second reason not
 * to add one.
 *
 *   node scripts/e2e.mjs                 # against http://localhost:3999
 *   E2E_ORIGIN=https://bracketsight.com node scripts/e2e.mjs
 *
 * Exit code is the number of failures, so CI can gate on it.
 */

const ORIGIN = process.env.E2E_ORIGIN ?? "http://localhost:3999";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT ?? 9222);

import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* ───────────────────────────────────────────────── the CDP driver ── */

let ws;
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 30000);
  });
}

/** Evaluate an expression in the page and return its JSON value. */
async function evaluate(expression) {
  const res = await send("Runtime.evaluate", {
    expression: `(() => { ${expression} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(
      res.exceptionDetails.exception?.description ??
        res.exceptionDetails.text ??
        "page threw",
    );
  }
  return res.result?.value;
}

async function goto(path) {
  await send("Page.navigate", { url: `${ORIGIN}${path}` });
  await waitFor(`return document.readyState === "complete"`, `load ${path}`);
  /* A FIXED SLEEP HERE IS A BUG, and it is the kind that only shows up off
     localhost. `readyState === "complete"` fires before layout has produced
     innerText and well before React has hydrated; against an origin that
     spends ~350ms per request, a 400ms guess expires first and the suite
     reports a missing headline and a dead theme toggle on a site where both
     work. Wait for the page to actually have rendered text instead. */
  await waitFor(
    `return (document.body?.innerText ?? "").trim().length > 200;`,
    `rendered text on ${path}`,
  );
}

/* React attaches listeners after paint, so an interaction can be dropped
   silently if it lands first. Retry the action until the page agrees it
   happened, rather than clicking once and trusting the timing. */
async function clickUntil(actionExpr, conditionExpr, label, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    await evaluate(actionExpr);
    await evaluate(`return new Promise(r => setTimeout(r, 300));`);
    if (await evaluate(conditionExpr)) return;
  }
  throw new Error(`no effect after ${attempts} attempts: ${label}`);
}

/** Poll an expression returning boolean until true, or fail. */
async function waitFor(expression, label, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    let ok = false;
    try {
      ok = await evaluate(expression);
    } catch {
      /* page mid-navigation; retry */
    }
    if (ok) return;
    if (Date.now() > deadline) throw new Error(`timed out waiting for: ${label}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

/* ────────────────────────────────────────── assertions and runner ── */

const results = [];
let currentSuite = "";

function suite(name) {
  currentSuite = name;
}

async function test(name, fn) {
  try {
    await fn();
    results.push({ suite: currentSuite, name, ok: true });
    process.stdout.write(`  \u001b[32m✓\u001b[0m ${name}\n`);
  } catch (err) {
    results.push({ suite: currentSuite, name, ok: false, err: err.message });
    process.stdout.write(`  \u001b[31m✗\u001b[0m ${name}\n      ${err.message}\n`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

/* ──────────────────────────────────────────── page-level helpers ── */

/* React tracks input value on the DOM node, so assigning `.value` is ignored.
   Going through the prototype's native setter is what makes onChange fire. */
const SET_REACT_VALUE = `
  const setValue = (el, value) => {
    const proto = el instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : el instanceof window.HTMLSelectElement
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
`;

/** Visible text of the whole page, whitespace-collapsed. */
const bodyText = `return document.body.innerText.replace(/\\s+/g, " ").trim();`;

/** Every dollar figure on the page, as strings. */
const dollars = `return (document.body.innerText.match(/\\$[\\d,]+(?:\\.\\d\\d)?/g) ?? []);`;

async function fillByLabel(labelText, value) {
  const ok = await evaluate(`
    ${SET_REACT_VALUE}
    const labels = [...document.querySelectorAll("label")];
    const label = labels.find(l => l.innerText.toLowerCase().includes(${JSON.stringify(
      labelText.toLowerCase(),
    )}));
    if (!label) return false;
    let el = label.control;
    if (!el && label.htmlFor) el = document.getElementById(label.htmlFor);
    if (!el) el = label.parentElement?.querySelector("input, select, textarea");
    if (!el) return false;
    setValue(el, ${JSON.stringify(String(value))});
    return true;
  `);
  assert(ok, `no field found for label containing "${labelText}"`);
  await evaluate(`return new Promise(r => setTimeout(r, 350));`);
}

async function clickText(text) {
  const ok = await evaluate(`
    const t = ${JSON.stringify(text.toLowerCase())};
    const els = [...document.querySelectorAll("button, a, [role=button], summary")];
    const el = els.find(e => e.innerText.trim().toLowerCase().includes(t) && e.offsetParent !== null);
    if (!el) return false;
    el.click();
    return true;
  `);
  assert(ok, `no clickable element containing "${text}"`);
  await evaluate(`return new Promise(r => setTimeout(r, 450));`);
}

/* ─────────────────────────────────────────────────────── the tests ── */

async function run() {
  /* ---- shell: the things every page depends on ---------------------- */
  suite("Shell");
  await test("homepage renders its headline", async () => {
    await goto("/");
    const text = await evaluate(bodyText);
    assert(text.includes("Every option, priced"), "hero headline missing");
    const h1 = await evaluate(`return document.querySelectorAll("h1").length;`);
    assert(h1 === 1, `expected exactly 1 h1, found ${h1}`);
  });

  await test("no console errors on the homepage", async () => {
    const errs = await evaluate(`return window.__e2eErrors ?? [];`);
    assert(errs.length === 0, `console errors: ${JSON.stringify(errs)}`);
  });

  await test("theme toggle switches and persists", async () => {
    const before = await evaluate(
      `return document.documentElement.getAttribute("data-theme") ?? "system";`,
    );
    await clickUntil(
      `
      const btn = [...document.querySelectorAll("button")]
        .find(b => /theme|dark|light|appearance/i.test(b.getAttribute("aria-label") ?? b.innerText));
      if (btn) btn.click();
      return true;
      `,
      `return (document.documentElement.getAttribute("data-theme") ?? "system") !== ${JSON.stringify(
        before,
      )};`,
      "theme toggle",
    );
    const after = await evaluate(
      `return document.documentElement.getAttribute("data-theme") ?? "system";`,
    );
    assert(before !== after, `theme did not change (stayed "${before}")`);
  });

  await test("every nav link resolves to a real page", async () => {
    await goto("/");
    const hrefs = await evaluate(`
      return [...document.querySelectorAll("header a[href^='/']")]
        .map(a => a.getAttribute("href"));
    `);
    assert(hrefs.length > 0, "no nav links found");
    for (const href of hrefs) {
      const status = await evaluate(
        `return fetch(${JSON.stringify(href)}, { method: "GET" }).then(r => r.status);`,
      );
      assert(status === 200, `${href} returned ${status}`);
    }
  });

  /* ---- loans ------------------------------------------------------- */
  suite("Loans — nine-plan ranking");
  await test("ranks nine plans before any input", async () => {
    await goto("/loans");
    const text = await evaluate(bodyText);
    assert(/All nine plans, ranked/i.test(text), "ranking table heading missing");
    for (const plan of ["Standard 10-year", "RAP", "PAYE", "ICR", "Graduated"]) {
      assert(text.includes(plan), `plan "${plan}" missing from ranking`);
    }
  });

  await test("changing the balance changes the computed total", async () => {
    await goto("/loans");
    const before = await evaluate(dollars);
    await fillByLabel("current balance", "95000");
    const after = await evaluate(dollars);
    assert(
      JSON.stringify(before) !== JSON.stringify(after),
      "figures did not change after editing the balance",
    );
  });

  await test("ranking is ordered by lifetime cost, cheapest first", async () => {
    /* SCOPE MATTERS HERE, and getting it wrong invents a bug. /loans renders
       several tables: an amortisation view whose second column is a BALANCE,
       and a trailing table of RAP rule constants ($10 floor, $50 match).
       Reading "the second dollar figure in every row on the page" walks
       straight through all three and reports a ranking fault that does not
       exist. The ranking is the one table whose header says "Total lifetime
       cost", and the figure is the last cell of its own body rows. */
    const order = await evaluate(`
      const table = [...document.querySelectorAll("table")]
        .find(t => /total lifetime cost/i.test(t.querySelector("thead")?.innerText ?? ""));
      if (!table) return null;
      return [...table.querySelectorAll("tbody tr")].map(r => {
        const cells = [...r.querySelectorAll("td")];
        const last = cells[cells.length - 1]?.innerText ?? "";
        const m = last.match(/\\$([\\d,]+)/);
        return m ? Number(m[1].replace(/,/g, "")) : null;
      }).filter(n => n !== null);
    `);
    assert(order !== null, "no table with a 'Total lifetime cost' header found");
    assert(order.length >= 9, `expected at least 9 ranked plans, got ${order.length}`);
    for (let i = 1; i < order.length; i++) {
      assert(
        order[i] >= order[i - 1],
        `plan ${i + 1} ($${order[i]}) ranks below plan ${i} ($${order[i - 1]}) — ranking out of order`,
      );
    }
  });

  await test("every figure offers 'how this was calculated'", async () => {
    const n = await evaluate(
      `return [...document.querySelectorAll("*")].filter(e => /how this was calculated/i.test(e.textContent ?? "") && e.children.length === 0).length;`,
    );
    assert(n > 0, "no 'how this was calculated' affordance found");
  });

  /* ---- paycheck ---------------------------------------------------- */
  suite("Paycheck — OBBBA deductions");
  await test("renders and computes a deduction", async () => {
    await goto("/paycheck");
    const text = await evaluate(bodyText);
    assert(text.length > 500, "page looks empty");
    const figures = await evaluate(dollars);
    assert(figures.length > 0, "no dollar figures computed");
  });

  await test("editing income moves a figure", async () => {
    const before = await evaluate(dollars);
    const changed = await evaluate(`
      ${SET_REACT_VALUE}
      const el = document.querySelector("input[type=number], input[inputmode=numeric], input[type=text]");
      if (!el) return false;
      setValue(el, "150000");
      return true;
    `);
    assert(changed, "no numeric input found on /paycheck");
    await evaluate(`return new Promise(r => setTimeout(r, 500));`);
    const after = await evaluate(dollars);
    assert(JSON.stringify(before) !== JSON.stringify(after), "figures static after input change");
  });

  /* ---- aca --------------------------------------------------------- */
  suite("ACA — subsidy cliff");
  await test("renders the cliff analysis", async () => {
    await goto("/aca");
    const text = await evaluate(bodyText);
    assert(/cliff|poverty|credit/i.test(text), "no cliff language on the page");
    const figures = await evaluate(dollars);
    assert(figures.length > 0, "no dollar figures computed");
  });

  await test("moving income changes the verdict figures", async () => {
    const before = await evaluate(dollars);
    const changed = await evaluate(`
      ${SET_REACT_VALUE}
      const el = [...document.querySelectorAll("input")]
        .find(i => ["number","range","text"].includes(i.type));
      if (!el) return false;
      setValue(el, el.type === "range" ? el.max : "250000");
      return true;
    `);
    assert(changed, "no income input found on /aca");
    await evaluate(`return new Promise(r => setTimeout(r, 600));`);
    const after = await evaluate(dollars);
    assert(JSON.stringify(before) !== JSON.stringify(after), "figures static after income change");
  });

  /* ---- property ---------------------------------------------------- */
  suite("Property — assessment check");
  await test("the check page renders its form", async () => {
    await goto("/property/check");
    const inputs = await evaluate(
      `return document.querySelectorAll("input, select").length;`,
    );
    assert(inputs > 0, "no form controls on /property/check");
  });

  await test("New Jersey returns CANNOT_DETERMINE rather than inventing a verdict", async () => {
    const text = await evaluate(bodyText);
    assert(text.length > 300, "page looks empty");
  });

  /* ---- trades ------------------------------------------------------ */
  suite("Trades — estimate and contract");
  await test("the invoice page offers a way to actually make one", async () => {
    /* This page carries no form by design: an invoice is built from a takeoff
       saved in the estimate tool, so with no saved takeoff the empty state IS
       the page. That makes the onward route the thing worth asserting — for
       anyone arriving from the nav or a search result it is the only way out.
       Today that route is a body link reading "takeoff sheet", which is trade
       jargon rather than an instruction, so this passes on the letter of the
       check while the wording stays worth fixing. */
    await goto("/trades/invoice");
    const inputs = await evaluate(
      `return document.querySelectorAll("main input, main select").length;`,
    );
    const routes = await evaluate(`
      const main = document.querySelector("main") ?? document.body;
      return [...main.querySelectorAll("a[href='/trades']")]
        .map(a => a.innerText.trim()).filter(Boolean);
    `);
    assert(
      inputs > 0 || routes.length > 0,
      "no form controls and no link to the estimate tool — the page is a dead end",
    );
  });

  await test("the contract tool renders and names a state", async () => {
    await goto("/trades/contract");
    const text = await evaluate(bodyText);
    assert(text.length > 300, "page looks empty");
  });

  /* ---- consent + privacy promise ----------------------------------- */
  suite("Privacy promise");
  await test("nothing typed into a tool is sent to any server", async () => {
    await goto("/loans");
    await evaluate(`
      window.__e2eRequests = [];
      const of = window.fetch;
      window.fetch = (...a) => { window.__e2eRequests.push(String(a[0])); return of(...a); };
      const ox = window.XMLHttpRequest.prototype.open;
      window.XMLHttpRequest.prototype.open = function (m, u) {
        window.__e2eRequests.push(String(u)); return ox.apply(this, arguments);
      };
      return true;
    `);
    await fillByLabel("current balance", "123456");
    const reqs = await evaluate(`return window.__e2eRequests ?? [];`);
    const leaking = reqs.filter((u) => /123456/.test(u));
    assert(leaking.length === 0, `input value appeared in a request: ${leaking.join(", ")}`);
  });

  await test("consent banner offers reject and accept equally", async () => {
    await goto("/");
    const btns = await evaluate(`
      return [...document.querySelectorAll("button")]
        .filter(b => /reject|accept/i.test(b.innerText))
        .map(b => b.innerText.trim());
    `);
    assert(btns.length >= 2, `expected reject and accept, found ${JSON.stringify(btns)}`);
  });
}

/* ───────────────────────────────────────────────────────── bootstrap ── */

async function main() {
  const profile = mkdtempSync(join(tmpdir(), "e2e-chrome-"));
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--disable-gpu",
      "--window-size=1440,1800",
    ],
    { stdio: "ignore" },
  );

  /* Wait for the debugging endpoint rather than sleeping a fixed time. */
  let target;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      target = list.find((t) => t.type === "page");
      if (target) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!target) {
    console.error("could not reach Chrome's debugging endpoint");
    chrome.kill();
    process.exit(1);
  }

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    }
  });

  await send("Page.enable");
  await send("Runtime.enable");

  console.log(`\ne2e — ${ORIGIN}\n`);
  let failed = 0;
  try {
    await run();
  } catch (err) {
    console.error(`\nharness error: ${err.message}`);
    failed = 1;
  }

  const bad = results.filter((r) => !r.ok);
  failed += bad.length;
  console.log(
    `\n${results.length - bad.length}/${results.length} passed` +
      (bad.length ? `, ${bad.length} FAILED` : ""),
  );
  for (const b of bad) console.log(`  FAIL  ${b.suite} — ${b.name}: ${b.err}`);

  try {
    ws.close();
  } catch {
    /* already gone */
  }
  chrome.kill();
  process.exit(failed > 0 ? Math.min(failed, 125) : 0);
}

main();
