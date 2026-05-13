# 商品比价器 Price Compare v1.0.32

本版本从 **v1.0.28** 继续迭代，重点修复 Cloudflare Worker 地址和访问密码偶发变空的问题。

## v1.0.32 更新内容

1. 修复 Cloudflare 地址 / 密码偶发变空
   - 本机缓存中的空 `workerUrl` / `appPassword` 不会再覆盖 `data.json` 里的真实配置。
   - 合并远程数据时只用非空同步配置覆盖，避免新设备或 iOS 主屏幕环境把云端配置清空。

2. 云端部署环境优先读取 `data.json`
   - GitHub Pages / Cloudflare Pages 等线上环境打开页面时，会每次先请求同目录 `data.json`。
   - 新设备不依赖旧缓存，直接以线上 `data.json` 作为启动数据来源。
   - 读取到 `data.json` 后，再继续使用其中的 Cloudflare Worker 地址和密码进行云端加载。

3. 本地 debug 逻辑保留
   - `file://`、`localhost`、`127.0.0.1` 本地环境仍然优先使用本机保存的同步配置。
   - 本地第一次使用需要在「更多 → 云端同步配置」中配置一次 Worker 地址和密码。
   - 配置后会缓存到当前浏览器，后续本地 debug 可以继续同步云端 `data.json`。

4. 云端同步配置保存保护
   - 保存云端同步配置时，Worker 地址和访问密码都不能为空。
   - 防止误点保存空配置，把当前设备或云端的同步配置清空。

## 当前同步逻辑

### 线上部署

```text
打开页面 / 刷新页面
↓
直接请求 ./data.json，不依赖本机旧缓存
↓
读取 data.json 里的 Cloudflare Worker 地址和访问密码
↓
通过 Worker 继续加载 GitHub 上的 data.json
```

### 本地 debug

```text
打开本地 index.html / localhost
↓
优先读取本机 localStorage 中保存的 Worker 地址和密码
↓
如果已配置，直接通过 Worker 加载云端 data.json
↓
如果未配置，需要手动配置一次
```

## GitHub 更新文件

需要上传 / 覆盖：

- `index.html`
- `README.md`

通常保留你线上已有的：

- `data.json`
- `worker.js`
- `manifest.webmanifest`
- `icons/`

## Cloudflare 更新

本版本不需要更新 Cloudflare Worker。

## 注意

不建议直接覆盖线上真实 `data.json`，除非你明确要重置线上数据。
