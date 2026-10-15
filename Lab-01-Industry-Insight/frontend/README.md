# 周报网页（GitHub Pages）

极简静态页面：在浏览器端把 `report.md` 渲染成网页。`report.md` / `report.json` 由
`build_weekly_report` 工具生成并同步到本目录。

## 在 Codespace 里预览

```bash
python -m http.server 8080 --directory Lab-01-Industry-Insight/frontend
```

Codespace 会弹出「端口 8080 已转发」，点 **在浏览器中打开** 即可。

> 直接双击 `index.html` 会因为浏览器跨域限制读不到 `report.md`，请用上面的静态服务器。

## 发布

合并周报 PR 到 `main` 后，`.github/workflows/deploy-pages.yml` 会自动把本目录发布到 GitHub Pages。
