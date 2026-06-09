# 商品比价器 Price Compare v1.0.67

本版本基于 **v1.0.66** 继续迭代，在商家 / 渠道配置中新增背景色维护，并将商家背景色同步展示到价格记录页面。

## v1.0.67 更新内容

1. **商家背景色配置**
   - 商家 / 渠道配置新增“背景色”字段。
   - 支持通过颜色选择器或十六进制颜色值维护，例如 `#F1F5F9`。
   - 背景色会写入 `stores[].backgroundColor` 和 `configs.stores[].backgroundColor`。

2. **页面同步显示商家背景色**
   - 桌面端价格记录表格按商家显示对应背景色。
   - 商家下拉框会同步显示当前所选商家的背景色。
   - 移动端价格卡片会同步显示对应商家的背景色。

3. **兼容旧数据**
   - 旧版 `data.json` 没有 `backgroundColor` 字段也可以正常加载。
   - 未配置背景色的商家保持原有页面样式。

4. **版本号同步更新**
   - `index.html` 版本号更新为 `v1.0.67`
   - `app.js` 版本号更新为 `v1.0.67`
   - 示例 `data.json` 版本号更新为 `v1.0.67`

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
