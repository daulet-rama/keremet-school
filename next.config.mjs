/**
 * Сборка под GitHub Pages.
 *
 * Pages отдаёт только статические файлы: ни серверного рендера, ни middleware.
 * Поэтому:
 *  - output: "export" — весь сайт превращается в набор HTML-файлов;
 *  - basePath/assetPrefix — проектная страница живёт не в корне домена,
 *    а по адресу /<репозиторий>/, и без префикса все ассеты дадут 404;
 *  - trailingSlash — Pages ищет index.html внутри каталога, поэтому /ru/
 *    надёжнее, чем /ru;
 *  - images.unoptimized — оптимизатор картинок Next требует сервера.
 *
 * Префикс включается только при сборке для Pages, чтобы `npm run dev`
 * продолжал работать по корню.
 */
const repo = "keremet-school";
const isPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: isPages ? `/${repo}` : undefined,
  assetPrefix: isPages ? `/${repo}/` : undefined,
  images: {
    // Реальные фотографии школы кладутся в /public/media/.
    // На Pages оптимизатор недоступен — форматы готовятся заранее.
    unoptimized: true,
  },
};

export default nextConfig;
