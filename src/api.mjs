import { RemoteError, UserError, mapApiError, mapNetworkError, missingTokenMessage } from "./errors.mjs";

function baseUrl(value) {
  return value.replace(/\/+$/, "");
}

export function requireToken(env = process.env) {
  const token = env.INVOLUTIONHELL_SATOKEN;
  if (!token) throw new UserError(missingTokenMessage());
  return token;
}

async function request(url, options, fetchImpl, operation) {
  let response;
  try {
    response = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    throw new RemoteError(mapNetworkError(error, operation));
  }
  if (!response.ok) throw new RemoteError(mapApiError(response.status, operation));
  try {
    return await response.json();
  } catch {
    throw new RemoteError("InvolutionHell returned an invalid JSON response.");
  }
}

export async function publishPost(payload, {
  env = process.env,
  fetchImpl = fetch,
  apiUrl = env.INVOLUTIONHELL_API_URL ?? "https://api.involutionhell.com",
  siteUrl = env.INVOLUTIONHELL_SITE_URL ?? "https://involutionhell.com",
} = {}) {
  const token = requireToken(env);
  const body = await request(`${baseUrl(apiUrl)}/api/posts`, {
    method: "POST",
    headers: { "content-type": "application/json", satoken: token },
    body: JSON.stringify(payload),
  }, fetchImpl, "publish");
  const post = body?.data;
  if (!post?.slug || !post.authorUsername) {
    throw new RemoteError("InvolutionHell returned an invalid publish response.");
  }
  const path = `/u/${encodeURIComponent(post.authorUsername)}/posts/${encodeURIComponent(post.slug)}`;
  return new URL(path, `${baseUrl(siteUrl)}/`).toString();
}

export async function whoAmI({
  env = process.env,
  fetchImpl = fetch,
  apiUrl = env.INVOLUTIONHELL_API_URL ?? "https://api.involutionhell.com",
} = {}) {
  const token = requireToken(env);
  const body = await request(`${baseUrl(apiUrl)}/auth/me`, {
    headers: { satoken: token },
  }, fetchImpl, "whoami");
  if (typeof body?.data?.username !== "string" || !body.data.username) {
    throw new RemoteError("InvolutionHell returned an invalid user response.");
  }
  return body.data.username;
}
