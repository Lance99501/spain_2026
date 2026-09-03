# Spain 2026 data

`data/source/` 是 GitHub 端可編輯的公開行程資料；`data/generated/bootstrap.json` 是前端唯一讀取的 runtime payload。

## 編輯流程

1. 修改 `data/source/`。
2. 執行 `npm run build:data`。
3. 執行 `npm test`。
4. Commit source 與 generated 檔案。

每日行程已拆成 `data/source/itinerary/YYYY-MM-DD.json`，之後接 Pages CMS、Notion publisher 或簡易 admin API 時，不需要再解析大型 JavaScript 檔案。

`assets/js/api.js` 只依賴 bootstrap DTO。預設讀取靜態 JSON；未來若有 Cloudflare Worker / ASP.NET Core，只需把 HTML 的 `spain-data-endpoint` 指向新的 JSON endpoint，UI 模組不用重寫。

## 公開資料邊界

此 repository 為 public。不要放入訂單號、付款資訊、旅客敏感資料、OAuth token 或 Google Drive 權限憑證。Google Drive file ID 不是登入憑證；實際票券仍由 Drive 的 Restricted / 指定帳號權限控制。

Confirmed / Fixed / Reservation 的真實性仍以官方票券與 Notion 定案為優先；重構資料格式本身不得改變既有狀態。
