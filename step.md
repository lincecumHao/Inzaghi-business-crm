請先閱讀專案根目錄的 business_requirement.md，這是完整的系統需求與設計文件。

我們要用 Next.js + PostgreSQL + Supabase + Vercel 建立這個業務系統。

請從以下順序開始：
1. 建立 DB schema（PostgreSQL）
2. 設定 Supabase 本地開發環境
3. 建立 Next.js 專案結構

測試要求：
- 使用 Vitest 作為測試框架，以 unit test 為主
- 分潤計算邏輯必須獨立成 pure function，方便測試
- 分潤 unit test 必須涵蓋以下邊界條件：
  - 季首日計算（跨年、跨月）
  - 年份以收款日起算（非日曆年）
  - 第一/二年 50%、第三年起 30% 的切換
  - 加購合約不產生分潤
- 其他模組暫不需要測試

請先從 DB schema 開始，確認後再繼續下一步。