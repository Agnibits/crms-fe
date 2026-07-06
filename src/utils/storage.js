import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

const cookieOptions = {
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/**
 * Token storage strategy:
 *  - access token → cookie (readable by Next.js middleware for route guards)
 *  - refresh token → cookie with longer expiry
 * In production, prefer httpOnly cookies set by the API; this client-side
 * fallback keeps the app self-contained when the API returns tokens in JSON.
 */
export const tokenStorage = {
  getAccessToken: () => Cookies.get(ACCESS_TOKEN_KEY),
  getRefreshToken: () => Cookies.get(REFRESH_TOKEN_KEY),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) Cookies.set(ACCESS_TOKEN_KEY, accessToken, { ...cookieOptions, expires: 1 });
    if (refreshToken) Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { ...cookieOptions, expires: 30 });
  },
  clear: () => {
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
  },
};
