# OneLaser Store — 1laser.com 重设计初稿

**预览链接：** https://yonge6.github.io/onelaser-store/

**团队协作仓库：** `Hydrax91129/OneLaser-Shopify` 的 `store-redesign` 分支（私有）。预览由公开镜像 `Yonge6/onelaser-store` 的 `main` 分支自动发布。

这是 1laser.com 购物站的重设计初稿（静态原型，不是线上店铺，不会产生真实订单）。

- **结构**：照 [DJI Store](https://us.store.dji.com/) + [Bambu Lab Store](https://us.store.bambulab.com/) 的购物框架；参考 [GoPro](https://gopro.com/en/us/)（Why shop / 应用场景）和 [ComMarker](https://store.commarker.com/)（机型对比）。
- **内容**：机器、配件、耗材、价格、图片、参数全部来自 www.1laser.com（2026-11-16 抓取，含黑五价）。品牌沿用 OneLaser 的 Certia 字体和红色。

## 页面（模块和 UI 规范对照 DJI Store 实测，2026-11-16）

| 页面 | 地址 | 模块（自上而下） |
| --- | --- | --- |
| 首页 | `#/` | 首屏轮播 + 分类条 → What's Hot（每条产品线一台，共 4 张）→ 黑五横幅 → Shop Machines（Desktop / Workshop / Industrial 三个标签共用一个模块）→ Why shop → Accessories & Materials。机器只有 9 台，所以不再每条线单独一个模块，也去掉了 Best Sellers |
| 列表页 | `#/collections/machines` 等 | 面包屑 → 居中标题 → 272 筛选栏（品类树、筛选、Reset）→ 件数 + 排序 → 3 列卡片 331×414 |
| 商品详情 | `#/products/:handle` | 照 Bambu Lab + ComMarker：面包屑 → 左侧吸顶图库（缩略图行、四个保障图标）/ 右侧长购买栏（红色价格+划线价+省多少、卖点列表、黑五倒计时条、套餐卡、选购帮助行、配件加购、数量+加购/立即购买、订单说明、支付方式）→ 吸顶锚点导航 → 深色产品总览 → Highlights at a Glance → 官网完整卖点长叙事（`src/components/Story.jsx`，深色：横幅、图文、切换式卖点、视频弹窗、作品墙、对比表、保障卡，滚动渐显）→ 机型对比 → 完整参数表 → FAQ；底部固定购买条 |
| 购物车 | `#/cart` | 极简页头 → 提示条 → 表格 726/150/150/150/24 → 左备注 600、右合计 500 → Continue Shopping / Check Out → 服务条 |
| 结算 | `#/checkout` | 照 DJI 结算页：65 页头 → 左 500 表单 / 右 400 订单摘要（灰底 #F5F5F5）→ 提示条、快捷支付、Contact、Delivery、Shipping method、Payment 单选列表、Pay now；手机端摘要折叠在顶部（仅演示，支付栏已禁用） |

**UI 规范（取自 DJI 实测值）**

| 项 | 桌面 | 手机 |
| --- | --- | --- |
| 首页底色 / 卡片 | 页面 `#F5F5F7`，卡片白底，圆角 8，1px `rgba(0,0,0,.04)` 描边 | 同 |
| 模块标题 h2 | 43.2/48，字重 800 | 28/31，字重 800 |
| 轮播标题 | 44/47，字重 700；副标题 18/25 | 36/38；14/20 |
| 按钮 | 胶囊形，44 高，13px 字重 700 | 40 高，12px |
| 页面宽度 | 页头/页脚内容上限 1392；模块内容 1440 时 1376，随屏幕变宽到上限 1664；首屏文字区上限 1440，首屏高度 430→520 | 左右 16 |
| 结算页表单 | 输入框 49 高、圆角 12、边框 #DEDEDE、浮动标签 14→12；标题 20/24 字重 600；Pay now 500×50 圆角 12，16 字重 600 | 单列，Pay now 347×50 |
| 商品卡 | 259 宽，图区 262 `#F7F8F9`，名称 20/25 字重 600，价格 16/22 字重 500 | 两列网格，名称 16/20 |
| 商品页 | 标题 32/36 字重 600，价格 20/24 字重 600，分节标题 32/48 字重 700，卖点卡标题 24/30 字重 600 | 分节标题 24/32，卖点卡 299×440 横滑 |
| 间距 | 首页模块上 34.56 下 36，左右 32；商品页分节上 104 | 模块上 16 下 24，左右 16 |

保留了 OneLaser 的两样东西：字体 Certia（DJI 用 Manrope）和品牌红（DJI 在同样位置用蓝 `#0060EF`）。DJI 的可变字重按就近映射到 Certia 的固定字重：850→800，720–760→700，600–650→600。

与 DJI 仍不同的地方：商品页没有 “In the Box”（官网没有装箱数据）；DJI 的 “Compare Options” 可展开行换成了 “Tech Specs”；What's Hot 卡片 DJI 有实拍背景图，这里是深色渐变加产品图；Why shop 的插图用的是图标；购物车没有做每行的勾选框。

购物流程：Add to Cart → 购物车页 → Check Out；Buy Now → 直接到结算。

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
