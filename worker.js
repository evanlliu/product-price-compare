const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-App-Password, Authorization",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      const requestUrl = new URL(request.url);
      validateEnv(env);
      validatePassword(request, env);

      if (request.method === "POST" && requestUrl.searchParams.get("action") === "parseProductLink") {
        const body = await safeJson(request);
        const data = await parseProductLink(body || {});
        return json({ ok: true, data });
      }

      if (request.method === "GET") {
        const file = await getGithubFile(env);
        const text = decodeBase64Unicode(file.content || "");
        const data = text ? JSON.parse(text) : {};
        return json({ ok: true, data, sha: file.sha || "" });
      }

      if (request.method === "POST" || request.method === "PUT") {
        const body = await request.json();
        const data = body && body.data ? body.data : body;
        const result = await saveGithubFile(env, data);
        return json({ ok: true, sha: result.content && result.content.sha ? result.content.sha : "" });
      }

      return json({ ok: false, error: "Method not allowed" }, 405);
    } catch (error) {
      const status = error.status || 500;
      return json({ ok: false, error: error.message || "Worker error" }, status);
    }
  }
};


async function safeJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

async function parseProductLink(input) {
  const raw = String(input.text || "").trim();
  const inputUrl = String(input.url || extractFirstUrl(raw) || "").trim();
  const platform = detectPlatform(raw, inputUrl);
  const localTitle = extractShareTitle(raw);
  const localPrice = extractPrice(raw);
  const localSpec = extractSpec(raw);
  const result = {
    platform,
    url: inputUrl,
    finalUrl: inputUrl,
    title: localTitle,
    pageTitle: "",
    price: localPrice,
    size: localSpec.size,
    unitText: localSpec.unitText,
    productId: "",
    fetched: false
  };

  if (!inputUrl || !/^https?:\/\//i.test(inputUrl)) {
    return result;
  }

  try {
    const response = await fetch(inputUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    });
    result.finalUrl = response.url || inputUrl;
    result.productId = extractProductId(`${result.finalUrl} ${raw}`, platform.key);
    const contentType = response.headers.get("content-type") || "";
    if (/text|html|json|javascript/i.test(contentType)) {
      const html = await response.text();
      result.fetched = true;
      const metaTitle = extractMetaTitle(html);
      const htmlPrice = extractPrice(html);
      const htmlSpec = extractSpec(`${metaTitle} ${html.slice(0, 15000)}`);
      result.pageTitle = cleanTitle(metaTitle, platform.key);
      if (!result.title) result.title = result.pageTitle;
      if (!result.price && htmlPrice) result.price = htmlPrice;
      if (!result.size && htmlSpec.size) {
        result.size = htmlSpec.size;
        result.unitText = htmlSpec.unitText;
      }
      if (!result.productId) result.productId = extractProductId(`${result.finalUrl} ${html.slice(0, 30000)}`, platform.key);
    }
  } catch (error) {
    result.error = error.message || "Fetch failed";
  }

  if (!result.productId) result.productId = extractProductId(`${result.finalUrl} ${raw}`, platform.key);
  return result;
}

function detectPlatform(text, url) {
  const source = `${text || ""} ${url || ""}`.toLowerCase();
  if (/yangkeduo|pinduoduo|pdd|拼多多/.test(source)) return { key: "pdd", zh: "拼多多/PDD", en: "PDD" };
  if (/douyin|iesdouyin|jinritemai|抖音/.test(source)) return { key: "douyin", zh: "抖音", en: "Douyin" };
  if (/taobao|tmall|e\.tb|m\.tb|淘宝|天猫/.test(source)) return { key: "taobao", zh: "淘宝", en: "Taobao" };
  if (/jd\.com|3\.cn|京东/.test(source)) return { key: "jd", zh: "京东/JD", en: "JD" };
  return { key: "unknown", zh: "", en: "" };
}

function extractFirstUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s，。；、]+/i);
  return match ? match[0].replace(/[，。,.;；）)】]+$/g, "") : "";
}

function extractShareTitle(text) {
  const source = String(text || "");
  const quoted = source.match(/「([^」]{2,160})」/) || source.match(/“([^”]{2,160})”/) || source.match(/"([^"]{2,160})"/);
  if (quoted) return quoted[1].trim();
  const douyin = source.match(/【抖音商城】\s*https?:\/\/\S+\s*([^\r\n]{4,160})/i);
  if (douyin) return douyin[1].replace(/长按复制.*$/g, "").trim();
  const afterUrl = source.match(/https?:\/\/\S+\s+([^\r\n]{4,160})/i);
  if (afterUrl && !/点击|打开|复制|搜索|查看|详情/.test(afterUrl[1])) return afterUrl[1].trim();
  return "";
}

function extractMetaTitle(html) {
  const source = String(html || "");
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ];
  for (const p of patterns) {
    const m = source.match(p);
    if (m && m[1]) return decodeHtml(m[1]).trim();
  }
  return "";
}

function cleanTitle(title, platformKey) {
  let text = String(title || "").replace(/\s+/g, " ").trim();
  text = text.replace(/[-_ ]*(淘宝网|天猫|京东|拼多多|抖音商城|抖音|PDD|JD).*$/i, "").trim();
  if (platformKey === "pdd") text = text.replace(/^拼多多\s*[-_ ]*/i, "").trim();
  return text;
}

function extractPrice(text) {
  const source = String(text || "").replace(/,/g, "");
  const patterns = [
    /(?:到手价|券后价|大促价|价格|金额|¥|￥)\s*[:：]?\s*(\d+(?:\.\d+)?)/i,
    /(?:price|salePrice|promPrice|mallPrice)["'\s:=]+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*元/,
    /(^|\s)(\d{1,5}(?:\.\d{1,2})?)\s*(?:包邮|起|到手)/
  ];
  for (const p of patterns) {
    const m = source.match(p);
    if (m) return numberOrZero(m[m.length - 1]);
  }
  return 0;
}

function extractSpec(text) {
  const source = String(text || "").replace(/\s+/g, " ");
  const unitPattern = "千克|公斤|kg|KG|克|g|G|毫升|ml|ML|升|L|l|片|抽|瓶|罐|包|袋|个|件|卷";
  const re = new RegExp(`(\d+(?:\.\d+)?)\s*(${unitPattern})`, "i");
  const m = source.match(re);
  if (!m) return { size: 0, unitText: "" };
  return { size: numberOrZero(m[1]), unitText: m[2] };
}

function extractProductId(text, platformKey) {
  const source = String(text || "");
  const patterns = platformKey === "pdd" ? [
    /goods_id[=\":%]+(\d+)/i,
    /goodsId[=\":%]+(\d+)/i
  ] : platformKey === "jd" ? [
    /sku[=\":%]+(\d+)/i,
    /product\/(\d+)\.html/i,
    /item\.jd\.com\/(\d+)\.html/i
  ] : platformKey === "douyin" ? [
    /product_id[=\":%]+(\d+)/i,
    /promotion_id[=\":%]+(\d+)/i,
    /goods_id[=\":%]+(\d+)/i
  ] : platformKey === "taobao" ? [
    /id[=\":%]+(\d+)/i,
    /itemId[=\":%]+(\d+)/i
  ] : [
    /goods_id[=\":%]+(\d+)/i,
    /product_id[=\":%]+(\d+)/i,
    /id[=\":%]+(\d+)/i
  ];
  for (const p of patterns) {
    const m = source.match(p);
    if (m && m[1]) return m[1];
  }
  return "";
}

function decodeHtml(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function validateEnv(env) {
  const required = ["GH_OWNER", "GH_REPO", "GH_BRANCH", "DATA_PATH", "GH_TOKEN", "APP_PASSWORD"];
  const missing = required.filter(key => !env[key]);
  if (missing.length) {
    throw createError(`Missing Worker variables: ${missing.join(", ")}`, 500);
  }
}

function validatePassword(request, env) {
  const headerPassword = request.headers.get("X-App-Password") || "";
  const auth = request.headers.get("Authorization") || "";
  const bearerPassword = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const password = headerPassword || bearerPassword;

  if (!password || password !== env.APP_PASSWORD) {
    throw createError("Unauthorized", 401);
  }
}

async function getGithubFile(env) {
  const apiUrl = githubContentsUrl(env);
  const response = await fetch(`${apiUrl}?ref=${encodeURIComponent(env.GH_BRANCH)}`, {
    method: "GET",
    headers: githubHeaders(env)
  });

  if (response.status === 404) {
    throw createError(`${env.DATA_PATH} not found in GitHub repository`, 404);
  }

  const body = await response.json();
  if (!response.ok) {
    throw createError(body.message || `GitHub GET failed: ${response.status}`, response.status);
  }

  return body;
}

async function saveGithubFile(env, data) {
  let sha = "";
  try {
    const existing = await getGithubFile(env);
    sha = existing.sha || "";
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  const content = encodeBase64Unicode(JSON.stringify(data, null, 2));
  const payload = {
    message: `Update ${env.DATA_PATH} ${new Date().toISOString()}`,
    content,
    branch: env.GH_BRANCH
  };

  if (sha) payload.sha = sha;

  const response = await fetch(githubContentsUrl(env), {
    method: "PUT",
    headers: githubHeaders(env),
    body: JSON.stringify(payload)
  });

  const body = await response.json();
  if (!response.ok) {
    throw createError(body.message || `GitHub PUT failed: ${response.status}`, response.status);
  }

  return body;
}

function githubContentsUrl(env) {
  const path = String(env.DATA_PATH || "data.json")
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
  return `https://api.github.com/repos/${encodeURIComponent(env.GH_OWNER)}/${encodeURIComponent(env.GH_REPO)}/contents/${path}`;
}

function githubHeaders(env) {
  return {
    "Authorization": `Bearer ${env.GH_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "product-price-compare-worker"
  };
}

function encodeBase64Unicode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64Unicode(base64) {
  const clean = String(base64 || "").replace(/\s/g, "");
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function createError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}
