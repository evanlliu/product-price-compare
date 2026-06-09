# 商品比价器 Price Compare v1.0.69

本版本基于 **v1.0.68** 调整商家背景色展示方式：背景色只显示在“商家 / 渠道”位置，不再铺满整行或整张移动端卡片。

## v1.0.69 更新内容

1. **商家背景色只作用于商家名称**
   - 桌面端：不再给整行记录加商家背景色，仅保留商家下拉框的背景色。
   - 移动端：不再给整张卡片加商家背景色，仅在商品标题里的商家名称上显示背景色标签。

2. **保留背景色配置能力**
   - 商家 / 渠道配置仍支持颜色选择器和十六进制颜色值，例如 `#F1F5F9`。
   - 背景色继续写入 `stores[].backgroundColor` 和 `configs.stores[].backgroundColor`。

3. **版本号同步更新**
   - `index.html` 版本号更新为 `v1.0.69`
   - `app.js` 版本号更新为 `v1.0.69`
   - 示例 `data.json` 版本号更新为 `v1.0.69`

## GitHub 更新文件

需要上传 / 覆盖：

- `index.html`
- `app.js`
- `README.md`

如果你希望本地示例包版本号也一致，可一并保留：

- `data.json`

注意：
不要用压缩包里的示例 `data.json` 覆盖线上真实数据，除非你确认要重置数据。

## Cloudflare Worker 更新

不需要更新。

继续使用原来的：

- `worker.js`
- `APP_PASSWORD`
- `DATA_PATH`
- `GH_BRANCH`
- `GH_OWNER`
- `GH_REPO`
- `GH_TOKEN`
