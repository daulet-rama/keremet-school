/** Быстрый опрос вычисленных стилей на живой странице через CDP. */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

/**
 * Второй аргумент — либо само выражение, либо путь к .js-файлу с ним.
 * Файл надёжнее: PowerShell портит выражения со стрелочными функциями
 * и кавычками при передаче в аргументах.
 */
const [url, exprOrPath] = process.argv.slice(2);
const expression =
  exprOrPath && exprOrPath.endsWith(".js") && existsSync(exprOrPath)
    ? readFileSync(exprOrPath, "utf8")
    : exprOrPath;
const edge = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

const PORT = 9800 + (process.pid % 150);
const proc = spawn(
  edge,
  [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + process.env.TEMP + "\\edge-probe-" + process.pid,
    "about:blank",
  ],
  { stdio: "ignore" }
);

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try {
    const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = tabs.find((t) => t.type === "page")?.webSocketDebuggerUrl;
  } catch {}
  if (!wsUrl) await sleep(250);
}

const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const seen = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  } else if (msg.method) seen.push(msg.method);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1500,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url });
for (let i = 0; i < 80 && !seen.includes("Page.loadEventFired"); i++) await sleep(100);
await sleep(2500);

const r = await send("Runtime.evaluate", {
  expression,
  returnByValue: true,
});
console.log(JSON.stringify(r.result?.value ?? r.exceptionDetails, null, 2));

ws.close();
proc.kill();
process.exit(0);
