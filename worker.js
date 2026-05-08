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
      validateEnv(env);
      validatePassword(request, env);

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
