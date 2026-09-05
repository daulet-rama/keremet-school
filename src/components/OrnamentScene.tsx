"use client";

import { useEffect, useRef } from "react";
import {
  CatmullRomCurve3,
  CanvasTexture,
  Group,
  Mesh,
  MeshMatcapMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { ornamentCurvePoints } from "@/lib/ornament3d";

/**
 * Орнамент в 3D.
 *
 * ЧТО ЭТО НЕ: не абстрактная плавающая форма в герое. Такой приём в 2026-м
 * читается как шаблон 2023-го. Здесь в объём выведен ровно тот знак, что уже
 * несёт бренд по всему сайту, — поэтому 3D работает содержанием, а не
 * украшением, и его можно смотреть с любого ракурса.
 *
 * МОБИЛЬНЫЙ ВПЕРВЫЕ ПОЛУЧАЕТ ФИРМЕННЫЙ ЭЛЕМЕНТ. Плоский рельс скрыт ниже
 * 1180px, то есть на телефоне лучшее, что есть на сайте, не показывалось
 * вообще. Сцена работает на всех размерах и закрывает эту дыру.
 *
 * Материал — matcap, нарисованный на canvas в рантайме. Он даёт металл без
 * единого источника света и без HDR-карты окружения: ноль сетевых запросов
 * и ноль расчёта освещения на кадр, что на телефоне решает.
 */

const UNITS = 2;

/** Матовый металл терракоты, сгенерированный в рантайме. */
function makeMatcap(): CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;

  const base = g.createRadialGradient(96, 78, 8, 128, 128, 152);
  base.addColorStop(0, "#ffe0d0");
  base.addColorStop(0.3, "#d2603a");
  base.addColorStop(0.72, "#7d2f18");
  base.addColorStop(1, "#25100a");
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);

  // Контровой блик снизу-справа — читается как отражённый свет пола.
  const rim = g.createRadialGradient(188, 198, 4, 188, 198, 86);
  rim.addColorStop(0, "rgba(255,206,175,0.8)");
  rim.addColorStop(1, "rgba(255,206,175,0)");
  g.fillStyle = rim;
  g.fillRect(0, 0, size, size);

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export default function OrnamentScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;

    // Уменьшенное движение: сцена не строится совсем, остаётся плоский SVG.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: !isCoarse, // MSAA на телефоне дороже, чем стоит
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL недоступен — SVG остаётся на месте
    }

    // Клампинг плотности пикселей. На телефонах dpr бывает 3–4, и полноэкранная
    // сцена в такой плотности гарантированно роняет частоту кадров и греет
    // устройство. Визуальной разницы выше 2 на этой геометрии нет.
    const maxDpr = isCoarse ? 1.75 : 2;

    const scene = new Scene();
    const camera = new PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0, 26);

    const pts = ornamentCurvePoints(UNITS).map(([x, y, z]) => new Vector3(x, y, z));
    const curve = new CatmullRomCurve3(pts, false, "catmullrom", 0.45);

    const geometry = new TubeGeometry(
      curve,
      isCoarse ? 340 : 620, // сегментов вдоль
      // На телефоне трубка толще: при малом физическом размере тонкая
      // линия читается ниткой и теряет объём. На десктопе наоборот —
      // толстая превращается в кляксу вместо орнамента.
      isCoarse ? 0.34 : 0.26,
      isCoarse ? 9 : 14, // сегментов по окружности
      false
    );

    const matcap = makeMatcap();
    const material = new MeshMatcapMaterial({ matcap });
    const mesh = new Mesh(geometry, material);

    const group = new Group();
    group.add(mesh);
    scene.add(group);

    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    mount.appendChild(renderer.domElement);
    // Сообщаем герою, что 3D поднялся: плоский SVG уходит.
    mount.dataset.ready = "1";

    function resize() {
      const w = mount!.clientWidth;
      const h = mount!.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Объект высотой ~15 мировых единиц должен помещаться целиком:
      // при fov 42° видимая высота равна 2·z·tan(21°), поэтому z ниже 22
      // обрезает орнамент сверху и снизу, и он перестаёт читаться формой.
      // На узком контейнере отъезжаем дальше — там кадрирует ширина.
      // Крупный кроп сверху и снизу — намеренный: полностью влезающий
      // мелкий объект выглядит робко, обрезанный крупный — уверенно.
      camera.position.z = w / h < 0.8 ? 30 : isCoarse ? 20 : 26;
      camera.updateProjectionMatrix();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- ввод: указатель на десктопе, наклон устройства на телефоне ----
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    function onPointer(e: PointerEvent) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    function onTilt(e: DeviceOrientationEvent) {
      if (e.gamma == null || e.beta == null) return;
      target.x = Math.max(-1, Math.min(1, e.gamma / 45));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
    }

    if (isCoarse) {
      // iOS требует явного разрешения по жесту пользователя, и без него
      // событие просто не приходит. Молча пробуем подписаться: если браузер
      // требует разрешения, наклон не заработает, но сцена продолжит жить
      // на прокрутке — деградация без единой ошибки в консоли.
      window.addEventListener("deviceorientation", onTilt, true);
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    // ---- цикл ----
    let scroll = 0;
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scroll = max > 0 ? window.scrollY / max : 0;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "120px" }
    );
    io.observe(mount);

    let raf = 0;
    let t = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      // Не рендерим, когда объект вне экрана или вкладка скрыта:
      // непрерывный цикл на фоне — прямой расход батареи.
      if (!visible || document.hidden) return;

      t += 0.0045;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      group.rotation.y = t + scroll * Math.PI * 2.2 + current.x * 0.5;
      // Постоянный наклон по X: строго фронтальный ракурс скрывает спираль
      // рога, и объём пропадает — форма выглядит плоской вырезкой.
      group.rotation.x = 0.22 + current.y * 0.3;
      group.rotation.z = Math.sin(t * 0.7) * 0.05;

      renderer.render(scene, camera);
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt, true);
      geometry.dispose();
      material.dispose();
      matcap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete mount.dataset.ready;
    };
  }, []);

  return <div className="hero__scene" ref={host} aria-hidden="true" />;
}
