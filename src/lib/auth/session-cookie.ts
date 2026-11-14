/** Must match `authConfig.cookies.sessionToken.name` in auth.config.ts */
export function authSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}
