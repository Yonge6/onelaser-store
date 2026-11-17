# OneLaser Store — 1laser.com 重设计初稿

**预览链接：** https://yonge6.github.io/onelaser-store/

**团队协作仓库：** `Hydrax91129/OneLaser-Shopify` 的 `store-redesign` 分支（私有）。预览由公开镜像 `Yonge6/onelaser-store` 的 `main` 分支自动发布。

这是 1laser.com 购物站的重设计初稿（静态原型，不是线上店铺，不会产生真实订单）。

- **结构**：照 [DJI Store](https://us.store.dji.com/) + [Bambu Lab Store](https://us.store.bambulab.com/) 的购物框架；参考 [GoPro](https://gopro.com/en/us/)（Why shop / 应用场景）和 [ComMarker](https://store.commarker.com/)（机型对比）。
- **内容**：机器、配件、耗材、价格、图片、参数全部来自 www.1laser.com（2026-11-16 抓取，含黑五价）。品牌沿用 OneLaser 的 Certia 字体和红色。

## 页面（结构以 DJI Store 为骨架，桌面和手机一致）

| 页面 | 地址 | 结构（自上而下） |
| --- | --- | --- |
| 首页 | `#/` | 促销轮播+倒计时 → 品类入口条 → What's Hot → 促销横幅 → Best Sellers → Why shop → 每条产品线一个区块（横幅 + 4 个商品 + Explore 入口）→ 选型入口 |
| 列表页 | `#/collections/machines` 等 | 面包屑 → 居中标题 → 左侧筛选栏（品类树、优惠/库存、Reset）→ 件数 + 排序 → 3 列卡片（手机 2 列，筛选变全屏面板） |
| 商品页 | `#/products/<handle>` | 购买区（图库、价格、权益框、选配置、推荐配件、Add to Cart / Buy Now）→ 锚点导航 → Take a Closer Look（桌面拼图网格，手机横滑）→ Use Cases → 视频 → Which is the Best for You → Specs（折叠）→ FAQ；底部吸附购买条 |
| 购物车 | `#/cart` | 极简页头 → 商品表格 → 左备注、右合计 → Continue Shopping / Check Out → 三项保障 |
| 结算 | `#/checkout` | Shopify 结算布局（仅演示，支付栏已禁用） |
| 机型对比 | `#/compare` | 全部机型参数对比表 |

购物流程：Add to Cart → 购物车页 → Check Out；Buy Now → 直接到结算。与 DJI 不同的三处：角标用了 Bambu 的 “$X OFF”，商品页多了一行视频和折叠的 Specs，首页末尾多了一个选型入口。

## 团队怎么改

| 想改什么 | 改哪个文件 |
| --- | --- |
| 促销条、导航、首页轮播/推荐/分区、卖点、FAQ、商品页推荐配件 | `src/data/site.js` |
| 商品数据（价格、图片、规格） | 不要手改 `src/data/catalog.json`；更新 `data-source/` 里的原始数据后运行 `npm run catalog` |
| 商品页卖点内容 | 更新 `data-source/product-pages.json` 后运行 `npm run stories`；版式和挑选规则在 `src/pages/Product.jsx` |
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
- 机器商品页的卖点、应用、视频、规格、保障内容抓自官网各商品页（`data-source/product-pages.json` → `npm run stories` → `src/data/stories.json`），商品页只挑其中一部分填进 DJI 的版式（`src/pages/Product.jsx` 的 `useStory`）。卖点卡片是自动挑的前 7 条，需要人工确认每台机器该放哪几条。
- 运费、税、分期、折扣码、账号登录都是占位；真实下单仍在 Shopify。
- 机器规格来自之前整理的规格表（`data-source/machine-specs.json`），本次未重新逐项核对。
