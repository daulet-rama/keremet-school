import type { TubeData } from "./tube";

/**
 * Декодирование запечённой геометрии.
 *
 * Модель лежит в бандле как base64, а не отдельным файлом: это снимает
 * сетевой запрос, снимает возню с basePath (на GitHub Pages сайт живёт
 * в подкаталоге, и относительные пути к ассетам — типовая причина 404)
 * и позволяет чанку приехать одним куском. Base64 раздувает данные на
 * треть, но gzip возвращает почти всё обратно.
 */
export function decodeBaked(
  positionB64: string,
  normalB64: string,
  indexB64: string
): TubeData {
  const bytes = (b64: string) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  const p = bytes(positionB64);
  const n = bytes(normalB64);
  const i = bytes(indexB64);

  return {
    position: new Float32Array(p.buffer, p.byteOffset, p.byteLength / 4),
    normal: new Float32Array(n.buffer, n.byteOffset, n.byteLength / 4),
    // uv не используется: материал matcap адресуется нормалью,
    // а не координатами текстуры.
    uv: new Float32Array(0),
    index: new Uint16Array(i.buffer, i.byteOffset, i.byteLength / 2),
  };
}
