/**
 * Достройка статического экспорта под GitHub Pages.
 *
 * 1. out/index.html — редирект корня на язык по умолчанию.
 *    В обычной сборке это делал middleware (src/proxy.ts), но статический
 *    экспорт middleware не поддерживает, поэтому редирект переезжает в
 *    страницу. Здесь три уровня подстраховки: meta refresh (работает без
 *    JS), скрипт (срабатывает мгновенно) и видимая ссылка на случай, если
 *    не отработало ни то, ни другое. Пустая белая страница недопустима.
 *
 * 2. out/.nojekyll — без этого файла GitHub Pages прогоняет вывод через
 *    Jekyll, а тот игнорирует каталоги, начинающиеся с подчёркивания.
 *    Весь /_next/ просто не публикуется, и сайт приезжает без стилей
 *    и скриптов. Это самая частая причина «залил на Pages, а всё сломалось».
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const DEFAULT_LOCALE = "ru";
const repo = "keremet-school";
const base = process.env.GITHUB_PAGES === "true" ? `/${repo}` : "";
const target = `${base}/${DEFAULT_LOCALE}/`;

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KEREMET</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>location.replace(${JSON.stringify(target)});</script>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;
       background:#f5f2ec;color:#16181d;
       font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  a{color:#b4472b}
</style>
</head>
<body><p>Переходим на сайт… <a href="${target}">Открыть</a></p></body>
</html>
`,
  "utf8"
);

writeFileSync(join(OUT, ".nojekyll"), "", "utf8");

console.log(`postbuild: out/index.html → ${target}, out/.nojekyll создан`);
