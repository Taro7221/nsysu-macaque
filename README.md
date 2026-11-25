# 中山獼猴大作戰

App Inventor 課堂專題：以中山大學獼猴為主題的射擊遊戲，結合 Google 雲端數據分析。

- `index.html`：遊戲網頁（GitHub Pages 會直接架在根目錄），用 `?scene=cuiheng|liberal|milo&player=暱稱` 切換場景
- `images/`：三個場景的背景照片（cuiheng.jpg、liberal.jpg、milo.jpg）
- `apps-script/`：貼到 Google 試算表 Apps Script 的後端程式與戰績頁
- `app-inventor-media/`：上傳到 App Inventor 媒體的地圖圖釘

遊戲網址：https://taro7221.github.io/nsysu-macaque/

API_URL（Apps Script 網頁應用程式）：https://script.google.com/macros/s/AKfycbzY2UhvBZKYK2Jfl5PkhJlJediJJrVIto41ctsa84J_ujhWd_DcrakU97nZWTHrisN3OQ/exec
- 戰績頁：`API_URL?page=stats&player=暱稱`
- 統計 JSON：`API_URL?action=json&player=暱稱`

成績試算表：https://docs.google.com/spreadsheets/d/1p8tOuIgdO_9NwGe3Vf2DfyhsJhauZd8tB7CejvTtFh0/edit
