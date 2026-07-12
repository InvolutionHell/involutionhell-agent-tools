export class UserError extends Error {
  constructor(message) {
    super(message);
    this.name = "UserError";
  }
}

export class RemoteError extends Error {
  constructor(message) {
    super(message);
    this.name = "RemoteError";
  }
}

export function missingTokenMessage() {
  return [
    "INVOLUTIONHELL_SATOKEN is not set.",
    "Log in at https://involutionhell.com, copy your satoken, then set it in the environment:",
    "  export INVOLUTIONHELL_SATOKEN=...",
    "The token is accepted only from the environment, never from a CLI flag.",
  ].join("\n");
}

export function mapApiError(status, operation = "request") {
  if (status === 401 || status === 403) {
    return "Your satoken is expired or invalid. Log in to InvolutionHell again, copy a new satoken, and update INVOLUTIONHELL_SATOKEN.";
  }
  if (status === 409 && operation === "publish") {
    return "That slug already exists. Choose another --slug and try again.";
  }
  if (operation === "publish") {
    return `InvolutionHell could not publish the post (HTTP ${status}). Try again later.`;
  }
  if (operation === "whoami") {
    return `InvolutionHell could not validate the token (HTTP ${status}). Try again later.`;
  }
  return `InvolutionHell returned HTTP ${status}. Try again later.`;
}

export function mapNetworkError(error, operation = "request") {
  const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
  const action = operation === "publish" ? "publish the post" : operation === "whoami" ? "validate the token" : "load the search index";
  return timedOut
    ? `Timed out while trying to ${action}. Try again later.`
    : `Could not reach InvolutionHell to ${action}. Check your network and try again.`;
}
