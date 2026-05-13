# 商品比价器 Price Compare v1.0.19

一个用于比较同类商品真实单价的小工具。项目使用 **HTML + jQuery** 实现，可部署到 **GitHub Pages**，并通过 **Cloudflare Worker** 把数据同步保存到 GitHub 仓库中的 `data.json`。

## 主要功能

- 商品分组管理，例如：洗面奶、牛奶、纸巾。
- 商品名称维护：商品名称绑定到商品分组，价格记录中通过下拉选择。
- 单位下拉项支持配置维护：编码、中文名称、英文名称、基础单位、换算系数都保存到 `data.json`。
- 商家 / 渠道管理，例如：店铺A、京东、淘宝、Trendyol、Migros。
- 价格记录行内编辑。
- 支持历史购买价格对比：本次待买价格可和上次购买价、历史平均价、历史最低价对比。
- 支持“买了”按钮，把本次待买记录转入已购买历史记录。
- 已购买记录默认锁定，不能编辑价格、规格、单位等字段；需要修改时先把状态释放回“本次待买”。
- 每单位价格统一保留 3 位小数，便于快速比较。
- 新增“码数 / Size Code”字段，位置在“单件规格”后面，用于记录鞋码、衣服码数、型号码等不参与单价计算的信息。
- 自动计算实际金额：`实际金额 = 金额 - 返现 / 优惠`。
- 自动计算总规格：`总规格 = 购买数量 × 单件规格`。
- 自动计算每单位价格：`每单位价格 = 实际金额 ÷ 总规格`。
- 自动标记最便宜记录。
- 显示比最低价贵多少百分比。
- 支持 PC 表格布局和移动端卡片布局。
- PC 端价格记录区域加宽，压缩表格列宽，尽量减少横向滚动条，优先直接看到全部内容。
- 支持中文 / English 多语言切换。
- 支持 Cloudflare Worker + GitHub `data.json` 云端同步。
- 支持右下角图标悬浮按钮：云端同步 ☁️ 和多语言切换 🌐。
- 支持 iOS Safari 添加到主屏幕：独立运行、应用图标、状态栏和安全区域适配。
- 所有配置都写入 `data.json`：语言、当前商品、商品分组、商家 / 渠道、单位配置、Cloudflare Worker 地址和访问密码。

## 文件说明

| 文件 | 说明 | 更新位置 |
|---|---|---|
| `index.html` | 前端主页面，包含 HTML、CSS、jQuery 逻辑 | GitHub |
| `data.json` | 云端同步数据文件，保存全部数据和配置：商品分组、商家、单位、语言、当前商品、同步配置、价格记录 | GitHub |
| `worker.js` | Cloudflare Worker 代码，用于读写 GitHub 的 `data.json` | Cloudflare Worker |
| `manifest.webmanifest` | PWA 配置文件，用于添加到主屏幕 / 独立运行 | GitHub |
| `icons/` | 应用图标，包含 iOS 主屏幕图标和浏览器图标 | GitHub |
| `README.md` | 项目说明文档 | GitHub |

## 部署结构建议

GitHub 仓库根目录建议放置：

```text
product-price-compare/
├── index.html
├── data.json
├── manifest.webmanifest
├── icons/
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

Cloudflare Worker 单独部署：

```text
worker.js
```

## GitHub Pages 部署

1. 把 `index.html`、`data.json`、`manifest.webmanifest`、`icons/`、`README.md` 上传到 GitHub 仓库。
2. 打开 GitHub 仓库：`Settings` → `Pages`。
3. Source 选择当前分支，例如 `main`。
4. 保存后，使用 GitHub Pages 地址访问页面。

## iOS Safari 添加到主屏幕

当前版本已经加入 iOS Safari Web App 适配：

- `apple-mobile-web-app-capable`：添加到主屏幕后可独立运行。
- `apple-mobile-web-app-title`：主屏幕应用名称。
- `apple-touch-icon`：iPhone / iPad 主屏幕图标。
- `manifest.webmanifest`：兼容更多浏览器的 PWA 配置。
- `safe-area-inset`：适配刘海屏 / 灵动岛 / 底部 Home Indicator。
- iOS 输入框字体强制不低于 16px，减少点击输入时页面被自动放大的问题。

使用方式：

```text
iPhone Safari 打开 GitHub Pages 地址
→ 点击分享按钮
→ 添加到主屏幕
→ 打开主屏幕上的“商品比价器”图标
```

注意：首次添加到主屏幕后，如果你后续更新了图标或 manifest，iOS 可能会缓存旧图标。必要时可以删除主屏幕旧图标后重新添加一次。

## Cloudflare Worker 变量配置

在 Cloudflare Worker 的 **Variables and Secrets** 中配置以下变量：

| Type | Name | 示例 | 说明 |
|---|---|---|---|
| Secret | `APP_PASSWORD` | 自己设置的访问密码 | 页面同步数据时使用的密码 |
| Secret | `GH_TOKEN` | GitHub Token | 用于 Worker 读写 GitHub 文件 |
| Plaintext | `GH_OWNER` | `evanliu` | GitHub 用户名或组织名 |
| Plaintext | `GH_REPO` | `product-price-compare` | GitHub 仓库名 |
| Plaintext | `GH_BRANCH` | `main` | GitHub 分支名 |
| Plaintext | `DATA_PATH` | `data.json` | 数据文件路径 |

> `GH_TOKEN` 需要有读取和写入仓库内容的权限。一般需要 `Contents: Read and write` 权限。

## Cloudflare Worker 部署

1. 打开 Cloudflare Worker。
2. 把 `worker.js` 的内容复制进去。
3. 保存并部署。
4. 确认 Worker 地址可以访问，例如：

```text
https://your-worker-name.your-subdomain.workers.dev
```

## 页面同步配置

打开页面后：

```text
更多 → 云端同步配置
```

填写：

| 配置项 | 说明 |
|---|---|
| Cloudflare Worker 地址 | 你的 Worker 访问地址 |
| 访问密码 | Cloudflare 中配置的 `APP_PASSWORD` |

点击：

```text
保存配置并同步
```

配置保存成功后，Worker 地址和访问密码会写入 `data.json`。这样其他设备打开页面时，会先读取 GitHub Pages 上的 `data.json`，然后自动使用其中的同步配置重新加载云端数据。

## data.json 保存内容

`data.json` 会保存全部数据和配置，主要结构如下：

| 字段 | 说明 |
|---|---|
| `version` | 当前程序版本 |
| `lang` / `settings.lang` | 当前语言，`zh` 或 `en` |
| `activeGroupId` / `settings.activeGroupId` | 当前选中的商品分组 |
| `sync` | Cloudflare Worker 地址、访问密码、最后加载 / 保存时间 |
| `stores` / `configs.stores` | 商家 / 渠道配置 |
| `units` / `configs.units` | 单位配置、换算基准、中文 / 英文显示名称 |
| `groups` | 商品分组、绑定的商品名称 `productNames`、以及所有价格记录 |

为了兼容旧版本，页面会同时兼容旧字段和新的 `settings`、`configs` 字段。保存到云端时，会自动把配置字段重新整理写入 `data.json`。

## 数据同步逻辑

页面打开或刷新时：

1. 先尝试读取当前 GitHub Pages 同目录下的 `data.json`。
2. 如果 `data.json` 中存在 Worker 地址和访问密码，则继续调用 Cloudflare Worker。
3. Worker 从 GitHub 仓库读取最新 `data.json`。
4. 页面使用云端数据覆盖本地数据。
5. 后续修改价格记录、商品分组、商品名称、商家配置、单位配置、语言、同步配置等内容时，会自动保存到 GitHub 的 `data.json`。

## 价格计算规则

### 实际金额

```text
实际金额 = 金额 - 返现 / 优惠
```

### 总规格

```text
总规格 = 购买数量 × 单件规格
```

### 每单位价格

```text
每单位价格 = 实际金额 ÷ 总规格
```

### 贵多少百分比

```text
贵百分比 = (当前单价 - 最低单价) ÷ 最低单价 × 100%
```

## 单位换算规则

当前支持：

| 单位 | 换算 |
|---|---|
| `g` | 克 |
| `kg` | 1 kg = 1000 g |
| `ml` | 毫升 |
| `L` | 1 L = 1000 ml |
| `pcs` | 个 |
| `bottle` | 瓶 |
| `pack` | 包 |
| `sheet` | 片 / 抽 |
| `roll` | 卷 |

系统可以自动比较：

```text
500 g vs 1 kg
500 ml vs 1 L
```

系统不会直接比较不同类型单位，例如：

```text
g vs ml
瓶 vs g
包 vs ml
```

## 安全说明

当前版本按需求把 **Cloudflare Worker 地址** 和 **访问密码** 保存到 `data.json`，方便多设备同步加载。

如果 GitHub 仓库或 GitHub Pages 是公开的，`data.json` 中的访问密码可能被别人看到。更安全的方式是：

- Worker 地址保存到 `data.json`。
- 访问密码只保存在当前设备的 `localStorage`。
- 或者将仓库设置为私有仓库，不公开 GitHub Pages 数据文件。

当前 v1.0.18 仍保持“地址和密码都保存到 `data.json`”的逻辑。

## 常见问题

### 1. 提示 Unauthorized / 401

检查页面里填写的访问密码是否和 Cloudflare Worker 中的 `APP_PASSWORD` 一致。

### 2. 提示 data.json not found / 404

检查：

- GitHub 仓库根目录是否存在 `data.json`。
- Cloudflare 变量 `DATA_PATH` 是否是 `data.json`。
- `GH_OWNER`、`GH_REPO`、`GH_BRANCH` 是否填写正确。

### 3. 提示 GitHub PUT failed / 403

通常是 `GH_TOKEN` 权限不足。请确认 GitHub Token 有仓库内容写入权限。

### 4. 页面修改后没有同步到 GitHub

检查：

- Cloudflare Worker 地址是否正确。
- 访问密码是否正确。
- Worker 变量是否完整。
- 浏览器控制台是否有 CORS 或网络错误。

### 5. 多设备数据不同步

建议操作顺序：

1. 设备 A 保存配置并同步。
2. 确认 GitHub 的 `data.json` 已更新。
3. 设备 B 刷新页面。
4. 如果没有自动加载，进入 `更多 → 云端同步配置`，点击 `重新加载云端`。

## 版本记录

### v1.0.19

- 已购买状态的记录自动锁定，价格、返现、购买数量、单件规格、码数、单位、日期等字段不可编辑。
- 保留“状态”下拉框可操作；需要修改历史记录时，先把状态从“已购买”释放回“本次待买”。
- 每单位价格显示统一调整为保留 3 位小数。
- PC 端表格中“总规格”和“每单位价格”继续保持纯数字显示，不再重复带单位。

### v1.0.18

- 新增“商品名称维护”配置页，商品名称绑定到商品分组。
- 价格记录表格新增“商品名称”下拉列，数据来源于当前商品分组下维护的商品名称。
- 新增“单位配置”页面，单位下拉项可维护编码、中文、英文、基础单位和换算系数。
- 历史价格对比按“商品名称 + 单位类型”分组，避免不同商品名称的历史价格互相干扰。
- PC 端表格中“总规格”和“每单位价格”不再追加单位文字，只显示数字，减少列宽占用。
- 兼容旧版 `data.json`：旧记录没有 `productNameId`、旧商品分组没有 `productNames` 时，会自动按商品分组名称补齐。

### v1.0.17

- 新增“日期 / Date”字段，用于记录本次价格或历史购买日期。
- 新增“状态 / Status”字段：`本次待买 / Current`、`已购买 / Purchased`。
- 新增“买了 / Bought”按钮，点击后将本次待买记录转为历史购买记录。
- 新增“历史对比 / History”列，显示本次价格比上次购买便宜还是贵。
- 价格记录上方的推荐条升级为购买建议：当前最低价、比上次/历史平均/历史最低的差异，以及“可以买 / 可以观望 / 建议等等”等提示。
- 当前比价只在“本次待买”记录之间比较，历史记录用于参考，不再干扰当前最便宜判断。
- 兼容旧版 `data.json`：旧记录没有 `priceDate`、`status` 字段也可以正常加载，保存后会自动补充。

### v1.0.16

- PC 端主内容最大宽度从原来的窄版布局扩大，充分利用左右空白区域。
- 价格记录表格列宽重新压缩，减少横向滚动条。
- 表格操作按钮、输入框和单元格间距进一步紧凑化。
- 移动端布局保持 v1.0.15 逻辑，不受本次 PC 表格优化影响。

### v1.0.15

- 基于 v1.0.13 继续优化，跳过 v1.0.14 的液态玻璃样式改动。
- 价格记录新增“码数 / Size Code”列。
- “码数”列位置放在“单件规格”后面、“单位”前面。
- PC 端表格和移动端卡片都支持直接输入“码数”。
- 兼容旧版 `data.json`：旧记录没有 `sizeCode` 字段也能正常加载，保存后会自动补充。

### v1.0.13

- 新增 iOS Safari 添加到主屏幕适配。
- 新增 `manifest.webmanifest`。
- 新增 `icons/` 应用图标文件。
- 新增 Apple Web App meta 标签，支持主屏幕独立运行。
- 增加 iOS 安全区域适配，避免刘海屏 / 灵动岛 / 底部 Home Indicator 遮挡。
- iOS Safari 输入框字体调整为不低于 16px，减少点击输入时自动放大的问题。

### v1.0.12

- 右下角悬浮快捷按钮改为竖向排列。
- 点击云端同步按钮 `☁️` 后直接执行云端保存。
- 未配置云端同步时只提示未配置，不再自动弹出配置页面。

### v1.0.11

- 新增右下角云端同步悬浮按钮 ☁️。
- 多语言切换按钮改为纯图标 🌐。
- 云端同步按钮和多语言按钮合并为同一组悬浮快捷按钮。
- 点击云端同步按钮时，如果已配置 Worker，则立即保存到 GitHub `data.json`；如果未配置，则自动打开云端同步配置页面。

### v1.0.10

- 所有配置统一保存到 `data.json`。
- 新增 `settings` 字段，保存语言和当前商品分组。
- 新增 `configs` 字段，保存商家 / 渠道配置和单位配置。
- 保留旧字段兼容逻辑，旧版 `data.json` 会自动迁移成新结构。

### v1.0.9

- 补充 `README.md` 项目说明文档。
- 更新页面版本号为 `v1.0.9`。
- `data.json` 初始版本号更新为 `v1.0.9`。

### v1.0.8

- 新增 Cloudflare Worker + GitHub `data.json` 云端同步。
- 新增云端同步配置页面。
- 新增 `worker.js`。
- 新增初始 `data.json`。

## 更新清单

### GitHub 需要更新

```text
index.html
README.md
```

说明：`data.json` 不建议覆盖线上真实数据，除非你是首次部署或确认要重置数据。

### Cloudflare Worker 需要更新

```text
不需要更新
```
