/**
 * Снимок страницы через Chrome DevTools Protocol.
 *
 * Обычный `--screenshot` у headless Edge ловит страницу в произвольный
 * момент и попадает в середину анимации Lenis. Здесь мы явно ждём загрузку,
 * даём анимациям доиграть, прокручиваем к нужному разделу и только потом
 * снимаем.
 *
 * Запуск:
 *   node scripts/shot.mjs <url> <out.png> [anchor] [width] [height]
 */
import { spawn } from "node:child_process";
import { writeFileSync, existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const [url, out, anchor = "", w = "1500", h = "1000"] = process.argv.slice(2);

const EDGE_PATHS = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edge = EDGE_PATHS.find((p) => existsSync(p));
if (!edge) throw new Error("Edge не найден");

const PORT = 9333 + (process.pid % 400);

const proc = spawn(
  edge,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=" + process.env.TEMP + "\\edge-shot-" + process.pid,
    "about:blank",
  ],
  { stdio: "ignore" }
);

async function endpoint() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const tabs = await r.json();
      const page = tabs.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error("CDP не поднялся");
}

const ws = new WebSocket(await endpoint());
await new Promise((res) => (ws.onopen = res));

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  } else if (msg.method) {
    events.push(msg.method);
  }
};

const send = (method, params = {}) =>
  new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send("Page.enable");
await send("Runtime.enable");

/**
 * Узкий экран снимаем КАК ТЕЛЕФОН, а не как узкое окно десктопа.
 *
 * Без эмуляции тача медиазапрос (pointer: coarse) не срабатывает, и код,
 * который ветвится по нему — плотность пикселей, толщина геометрии,
 * гироскоп вместо мыши — молча идёт по десктопной ветке. Проверяешь одно,
 * а смотришь другое.
 */
const isPhone = Number(w) < 900;
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: isPhone ? 2 : 1,
  mobile: isPhone,
});
if (isPhone) {
  await send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  await send("Emulation.setEmitTouchEventsForMouse", {
    enabled: true,
    configuration: "mobile",
  });
}

await send("Page.navigate", { url });
for (let i = 0; i < 80 && !events.includes("Page.loadEventFired"); i++) {
  await sleep(100);
}
// Даём шрифтам загрузиться и анимациям входа доиграть.
await sleep(2500);

if (anchor) {
  // "y:1234" — прокрутка к абсолютной позиции; иначе к разделу по id.
  const expr = anchor.startsWith("y:")
    ? `window.scrollTo(0, ${Number(anchor.slice(2))}), "ok"`
    : `
      (() => {
        const el = document.getElementById(${JSON.stringify(anchor)});
        if (!el) return "no-anchor";
        const y = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, y);
        return "ok";
      })()
    `;
  await send("Runtime.evaluate", { expression: expr });
  // ScrollTrigger и scroll-driven анимации должны доиграть после прыжка.
  await sleep(2200);
}

const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
});

writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log(`${out} ${Buffer.from(shot.data, "base64").length} B`);

ws.close();
proc.kill();
process.exit(0);
