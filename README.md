# OneLaser Store — 1laser.com 重设计初稿

**预览链接：** https://yonge6.github.io/onelaser-store/

**团队协作仓库：** `Hydrax91129/OneLaser-Shopify` 的 `store-redesign` 分支（私有）。预览由公开镜像 `Yonge6/onelaser-store` 的 `main` 分支自动发布。

这是 1laser.com 购物站的重设计初稿（静态原型，不是线上店铺，不会产生真实订单）。

- **结构**：照 [DJI Store](https://us.store.dji.com/) + [Bambu Lab Store](https://us.store.bambulab.com/) 的购物框架；参考 [GoPro](https://gopro.com/en/us/)（Why shop / 应用场景）和 [ComMarker](https://store.commarker.com/)（机型对比）。
- **内容**：机器、配件、耗材、价格、图片、参数全部来自 www.1laser.com（2026-11-16 抓取，含黑五价）。品牌沿用 OneLaser 的 Certia 字体和红色。

## 页面

| 页面 | 地址 | 对应参考 |
| --- | --- | --- |
| 首页 | `#/` | DJI：促销轮播+倒计时 → 品类入口 → What's Hot → 系列区块；Bambu：机器分类 Tab、配件 Tab、Why buy |
| 列表页 | `#/collections/machines`（另有 accessories / materials / deals 及各子类） | Bambu：Help me choose 横幅、集合内搜索、筛选、排序、4 列卡片 |
| 商品页 | `#/products/<handle>` | DJI：左图库右购买区、Select Option、Don't Miss Top Accessories、合计；Bambu：底部吸附 Add to Cart / Buy Now |
| 购物车 | 右侧抽屉 + `#/cart` | DJI/Bambu |
| 结算 | `#/checkout` | Shopify 结算布局（仅演示，支付栏已禁用） |
| 机型对比 | `#/compare` | ComMarker Model Comparison |

## 团队怎么改

| 想改什么 | 改哪个文件 |
| --- | --- |
| 促销条、导航、首页轮播/推荐/分区、卖点、FAQ、商品页推荐配件 | `src/data/site.js` |
| 商品数据（价格、图片、规格） | 不要手改 `src/data/catalog.json`；更新 `data-source/` 里的原始数据后运行 `npm run catalog` |
| 颜色、字号、间距、响应式 | `src/styles.css`（顶部 `:root` 是设计变量） |
| 各页面结构 | `src/pages/*.jsx`，公共头尾和购物车在 `src/components/` |

协作流程：在公司仓库从 `store-redesign` 开分支 → 改 → 提 Pull Request 合并回 `store-redesign` → 同步到 `Yonge6/onelaser-store` 的 `main` 后，GitHub Actions 自动发布到预览链接（约 1–2 分钟）。公司仓库的 `main` 留给 Shopify 主题代码，不要把原型推到那里。

```bash
npm install
npm run dev      # 本地预览 http://localhost:5173/onelaser-store/
npm run build
```

## 初稿待确认 / 已知缺口

- 首页轮播第一张用的是带文字的旧 banner，左侧用深色遮罩盖住了原文字；需要一张无文字的 XRF 主视觉。
- 「Why buy」里的承诺（30 天退货、3-2-1 保修、美国本土支持等）取自官网现有文案，上线前需老板确认。
- 商品页推荐配件的兼容性按机型系列粗配（`site.js` 的 `addOns`），需逐型号核对。
- 商品页长图文（Overview）只放了官网描述摘要和前几张图，完整卖点故事还没搬。
- 运费、税、分期、折扣码、账号登录都是占位；真实下单仍在 Shopify。
- 机器规格来自之前整理的规格表（`data-source/machine-specs.json`），本次未重新逐项核对。
