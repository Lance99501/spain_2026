# Spain 2026

西班牙 2026 行程網站，採用原生 HTML、CSS 與 JavaScript，並以 GitHub Pages/PWA 形式運作。正式功能開發使用 `Dev/*` 分支；未經專案擁有者同意不得合併回 `main`。

## 本機執行

需求：Node.js 22 以上。

```bash
npm install
npm run start
```

網站預設位於 <http://127.0.0.1:4173>。

## 測試

第一次執行瀏覽器測試前安裝 Chromium：

```bash
npx playwright install chromium
```

執行全部測試：

```bash
npm test
```

也可以分別執行資料關聯測試或瀏覽器 smoke test：

```bash
npm run test:data
npm run test:smoke
```

資料測試會驗證地點、住宿、票券、行程與地圖設定之間的 ID 關聯；瀏覽器測試會啟動本機靜態伺服器並確認主要頁面、搜尋、展開行程與 Today Mode 能正常運作。
