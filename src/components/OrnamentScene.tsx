"use client";

import { useEffect, useRef } from "react";
import { Camera, Geometry, Mesh, Program, Renderer, Texture, Transform } from "ogl";
import { buildShanyrak } from "@/lib/shanyrak";

/**
 * Орнамент в 3D.
 *
 * ЧТО ЭТО НЕ: не абстрактная плавающая форма. В объём выведен ровно тот
 * знак, что уже несёт бренд по всему сайту, — поэтому 3D работает
 * содержанием, а не украшением.
 *
 * МОБИЛЬНЫЙ ВПЕРВЫЕ ПОЛУЧАЕТ ФИРМЕННЫЙ ЭЛЕМЕНТ: плоский рельс скрыт ниже
 * 1180px, то есть на телефоне лучшего на сайте не было вовсе.
 *
 * ПОЧЕМУ ogl, А НЕ three.js. Замер: минимальная сцена на three — около
 * 125 КБ gzip, из которых 66% приходится на рендерер, а каталог геометрий
 * (ради TubeGeometry всё и затевалось) — 3,4 КБ из 527. Та же сцена на ogl
 * весит 13,4 КБ. Разница в 118 КБ — это 27% веса всей страницы, и платить
 * их за неиспользуемые PBR, тени, GLTF, PMREM и WebXR незачем.
 * Контраргумент честный: в выборке награждённых сайтов three.js стоит у
 * всех, а ogl ни у кого. Но там полноэкранные WebGL-миры, где вес
 * рендерера окупается функциональностью; здесь один объект, без единого
 * источника света и без единой текстуры из сети.
 */

/** Матовый металл терракоты, нарисованный на canvas в рантайме. */
function makeMatcapCanvas(): HTMLCanvasElement {
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
  rim.addColorStop(0, "rgba(255,206,175,0.85)");
  rim.addColorStop(1, "rgba(255,206,175,0)");
  g.fillStyle = rim;
  g.fillRect(0, 0, size, size);

  return c;
}

const VERT = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/* Matcap: нормаль в пространстве вида напрямую адресует текстуру сферы.
   Ноль источников света и ноль расчёта освещения на фрагмент. */
const FRAG = `
precision highp float;
uniform sampler2D tMatcap;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  vec2 uv = n.xy * 0.5 + 0.5;
  gl_FragColor = texture2D(tMatcap, uv);
}
`;

export default function OrnamentScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = host.current;
    if (!mount) return;

    // Уменьшенное движение: сцена не строится, остаётся плоский SVG.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isCoarse = window.matchMedia("(pointer: coarse)").matches;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        // Нативный MSAA дёшев на мобильных тайловых GPU: сглаживание
        // разрешается внутри тайла и не выгружается в общую память.
        antialias: true,
        // Трубка перекрывает саму себя, поэтому буфер глубины обязателен.
        depth: true,
        powerPreference: "high-performance",
      });
    } catch {
      return; // WebGL недоступен — плоский SVG остаётся на месте
    }

    const gl = renderer.gl;
    gl.canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    mount.appendChild(gl.canvas);
    mount.dataset.ready = "1";

    const camera = new Camera(gl, { fov: 42, near: 0.1, far: 200 });
    const scene = new Transform();
    const group = new Transform();
    group.setParent(scene);

    const tube = buildShanyrak({
      radius: 5,
      thickness: 0.3,
      gridPerFamily: 3,
      sockets: 16,
      // На телефоне режем детализацию прутка: при физическом размере
      // экрана разницу между 6 и 10 сегментами по окружности не видно,
      // а вершин становится вдвое меньше.
      lengthSegments: isCoarse ? 140 : 220,
      radialSegments: isCoarse ? 6 : 9,
    });

    const geometry = new Geometry(gl, {
      position: { size: 3, data: tube.position },
      normal: { size: 3, data: tube.normal },
      uv: { size: 2, data: tube.uv },
      index: { data: tube.index },
    });

    const matcap = new Texture(gl, {
      image: makeMatcapCanvas(),
      generateMipmaps: false,
    });

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: { tMatcap: { value: matcap } },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(group);

    function resize() {
      const w = mount!.clientWidth;
      const h = mount!.clientHeight;
      if (!w || !h) return;

      // Плотность пикселей: на телефонах dpr доходит до 3-4, и полноэкранная
      // сцена в такой плотности роняет частоту кадров и греет устройство.
      let dpr = Math.min(window.devicePixelRatio || 1, isCoarse ? 1.75 : 2);

      // Жёсткий потолок по числу пикселей поверх коэффициента: на планшете
      // даже dpr 1.75 даёт площадь, которую мобильный GPU не тянет.
      const budget = 1920 * 1080;
      if (w * h * dpr * dpr > budget) {
        dpr = Math.max(1, Math.sqrt(budget / (w * h)));
      }

      renderer.dpr = dpr;
      renderer.setSize(w, h);

      // Вписывание по ОБЕИМ осям, а не подобранное на глаз число.
      // Контейнер сцены вытянут по вертикали, поэтому ограничивает ширина:
      // видимая высота равна 2·z·tan(fov/2), видимая ширина — она же,
      // умноженная на соотношение сторон. Подбор «на глаз» ломался ровно
      // здесь — объект вылезал вбок на текст.
      const aspect = w / h;
      const fov = (42 * Math.PI) / 180;
      const objectSize = 12.5; // диаметр обода с гнёздами
      const zByHeight = objectSize / (2 * Math.tan(fov / 2));
      camera.position.z = Math.max(zByHeight, zByHeight / aspect) * 1.06;
      camera.perspective({ aspect });
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- ввод ----
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
      // iOS требует разрешения по жесту пользователя. Подписываемся молча:
      // если событие не придёт, сцена продолжит жить на прокрутке, и
      // никакой ошибки пользователь не увидит.
      window.addEventListener("deviceorientation", onTilt, true);
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

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
      // Вне экрана и на скрытой вкладке не рендерим: непрерывный цикл
      // на фоне — прямой расход батареи.
      if (!visible || document.hidden) return;

      t += 0.0045;
      current.x += (target.x - current.x) * 0.05;
      current.y += (target.y - current.y) * 0.05;

      // Шаңырақ лежит в плоскости XY, поэтому его нужно завалить к зрителю:
      // строго сверху он читается плоским кругом, строго с ребра —
      // отрезком. Наклон около −1 радиана показывает и обод, и купол.
      group.rotation.x = -1.02 + current.y * 0.28;
      group.rotation.y = Math.sin(t * 0.6) * 0.12 + current.x * 0.35;
      // Вращение по оси симметрии: объект радиально симметричен, поэтому
      // вертится ровно и хорош с любого угла — чего трубке не хватало.
      group.rotation.z = t + scroll * Math.PI * 1.6;

      renderer.render({ scene, camera });
    }
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt, true);
      // У ogl нет dispose: освобождаем контекст явно, иначе браузер
      // упрётся в лимит одновременных WebGL-контекстов.
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      gl.canvas.remove();
      delete mount.dataset.ready;
    };
  }, []);

  return <div className="hero__scene" ref={host} aria-hidden="true" />;
}
