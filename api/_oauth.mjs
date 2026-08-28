/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {createHash, randomBytes, timingSafeEqual} from 'node:crypto';

const OAUTH_ORIGIN = 'https://kb.n8nmydomain.com';
const OAUTH_CALLBACK_URL = `${OAUTH_ORIGIN}/api/callback`;
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const OAUTH_SCOPE = 'public_repo';
const OAUTH_PROVIDER = 'github';
const STATE_COOKIE = '__Host-decap_oauth';
const STATE_MAX_AGE_SECONDS = 10 * 60;
const PREVIEW_HOST_PATTERN =
  /^docusaurus-knowledge-base(?:-[a-z0-9]+)*-12222as-projects\.vercel\.app$/;

const securityHeaders = Object.freeze({
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'text/html; charset=utf-8',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

export class OAuthRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'OAuthRequestError';
    this.status = status;
  }
}

function randomBase64Url(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

function parseExtraOrigins(value = '') {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        return undefined;
      }
    })
    .filter(Boolean);
}

export function isAllowedSiteOrigin(origin, extraOrigins = '') {
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.protocol !== 'https:') {
    return false;
  }

  const explicitlyAllowed = new Set([
    'https://kb.n8nmydomain.com',
    'https://docusaurus-knowledge-base.vercel.app',
    ...parseExtraOrigins(extraOrigins),
  ]);

  return (
    explicitlyAllowed.has(url.origin) || PREVIEW_HOST_PATTERN.test(url.hostname)
  );
}

export function resolveSiteOrigin(siteId, extraOrigins = '') {
  if (typeof siteId !== 'string' || !siteId || siteId.length > 253) {
    throw new OAuthRequestError(
      'The CMS site identifier is missing or invalid.',
    );
  }

  let url;
  try {
    url = new URL(siteId.includes('://') ? siteId : `https://${siteId}`);
  } catch {
    throw new OAuthRequestError('The CMS site identifier is invalid.');
  }

  if (
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !isAllowedSiteOrigin(url.origin, extraOrigins)
  ) {
    throw new OAuthRequestError(
      'This site is not allowed to use the CMS login service.',
      403,
    );
  }

  return url.origin;
}

export function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function createPkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function createOAuthContext(siteOrigin) {
  const verifier = randomBase64Url(48);
  return {
    createdAt: Date.now(),
    origin: siteOrigin,
    state: randomBase64Url(),
    verifier,
    challenge: createPkceChallenge(verifier),
  };
}

function encodeContext(context) {
  return Buffer.from(JSON.stringify(context)).toString('base64url');
}

function decodeContext(value) {
  try {
    const context = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    );
    if (
      typeof context?.createdAt !== 'number' ||
      typeof context?.origin !== 'string' ||
      typeof context?.state !== 'string' ||
      typeof context?.verifier !== 'string'
    ) {
      return undefined;
    }
    return context;
  } catch {
    return undefined;
  }
}

function readCookies(cookieHeader = '') {
  if (typeof cookieHeader !== 'string' || !cookieHeader) {
    return {};
  }
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        if (separator === -1) {
          return [part, ''];
        }

        try {
          return [
            part.slice(0, separator),
            decodeURIComponent(part.slice(separator + 1)),
          ];
        } catch {
          return [part.slice(0, separator), ''];
        }
      }),
  );
}

export function readOAuthContext(request) {
  const value = readCookies(request.headers.get('cookie'))[STATE_COOKIE];
  return value ? decodeContext(value) : undefined;
}

function createStateCookie(context) {
  return `${STATE_COOKIE}=${encodeURIComponent(encodeContext(context))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_MAX_AGE_SECONDS}`;
}

function clearStateCookie() {
  return `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function validateContext(context, state, extraOrigins = '') {
  if (!context || !safeEqual(context.state, state)) {
    throw new OAuthRequestError(
      'The OAuth state is missing or does not match. Please try logging in again.',
    );
  }
  if (Date.now() - context.createdAt > STATE_MAX_AGE_SECONDS * 1000) {
    throw new OAuthRequestError(
      'The OAuth login request has expired. Please try again.',
    );
  }
  if (!isAllowedSiteOrigin(context.origin, extraOrigins)) {
    throw new OAuthRequestError('The OAuth login origin is not allowed.', 403);
  }
}

function requireOAuthEnvironment(env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new OAuthRequestError(
      'The CMS login service is not configured.',
      503,
    );
  }
  return {clientId, clientSecret};
}

function authorizationUrl({clientId, context}) {
  const url = new URL(GITHUB_AUTHORIZE_URL);
  url.search = new URLSearchParams({
    allow_signup: 'false',
    client_id: clientId,
    code_challenge: context.challenge,
    code_challenge_method: 'S256',
    redirect_uri: OAUTH_CALLBACK_URL,
    scope: OAUTH_SCOPE,
    state: context.state,
  }).toString();
  return url.toString();
}

function htmlHeaders(nonce) {
  return {
    ...securityHeaders,
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  };
}

function escapeForInlineScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const code = character.charCodeAt(0).toString(16).padStart(4, '0');
    return `\\u${code}`;
  });
}

export function createPopupResponse({origin, status, data}) {
  const nonce = randomBase64Url(18);
  const message = `authorization:${OAUTH_PROVIDER}:${status}:${JSON.stringify(data)}`;
  const scriptOrigin = escapeForInlineScript(origin);
  const scriptMessage = escapeForInlineScript(message);
  const statusText =
    status === 'success'
      ? 'Authorization complete. This window will close automatically.'
      : 'Authorization failed. Return to the CMS and try again.';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Knowledge Base authorization</title>
  </head>
  <body>
    <p id="status">Completing authorization…</p>
    <script nonce="${nonce}">
      (() => {
        const targetOrigin = ${scriptOrigin};
        const responseMessage = ${scriptMessage};
        const statusElement = document.getElementById('status');
        const openerWindow = window.opener;

        if (!openerWindow) {
          statusElement.textContent = 'The CMS window is unavailable. Close this window and try again.';
          return;
        }

        const receiveMessage = (event) => {
          if (
            event.source !== openerWindow ||
            event.origin !== targetOrigin ||
            event.data !== 'authorizing:${OAUTH_PROVIDER}'
          ) {
            return;
          }

          window.removeEventListener('message', receiveMessage, false);
          openerWindow.postMessage(responseMessage, targetOrigin);
          statusElement.textContent = ${escapeForInlineScript(statusText)};
          window.setTimeout(() => window.close(), 150);
        };

        window.addEventListener('message', receiveMessage, false);
        openerWindow.postMessage('authorizing:${OAUTH_PROVIDER}', targetOrigin);
      })();
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      ...htmlHeaders(nonce),
      'Set-Cookie': clearStateCookie(),
    },
  });
}

function createStandaloneErrorResponse(message, status = 400) {
  const nonce = randomBase64Url(18);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Knowledge Base authorization error</title>
  </head>
  <body>
    <h1>Authorization failed</h1>
    <p>${message.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)}</p>
  </body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      ...htmlHeaders(nonce),
      'Set-Cookie': clearStateCookie(),
    },
  });
}

async function exchangeCodeForToken({
  code,
  verifier,
  clientId,
  clientSecret,
  fetchImpl,
}) {
  const response = await fetchImpl(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'docusaurus-knowledge-base-cms',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: verifier,
      redirect_uri: OAUTH_CALLBACK_URL,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new OAuthRequestError(
      'GitHub returned an invalid OAuth response.',
      502,
    );
  }

  if (
    !response.ok ||
    payload.error ||
    typeof payload.access_token !== 'string'
  ) {
    throw new OAuthRequestError(
      'GitHub rejected the OAuth token request.',
      502,
    );
  }

  return payload.access_token;
}

function errorDetails(error) {
  return error instanceof OAuthRequestError
    ? {message: error.message, status: error.status}
    : {message: 'The OAuth login could not be completed.', status: 500};
}

export function handleAuthorize(request, env = process.env) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('provider') !== OAUTH_PROVIDER) {
      throw new OAuthRequestError(
        'Only the GitHub OAuth provider is supported.',
      );
    }

    const {clientId} = requireOAuthEnvironment(env);
    const origin = resolveSiteOrigin(
      url.searchParams.get('site_id'),
      env.CMS_ALLOWED_ORIGINS,
    );
    const context = createOAuthContext(origin);

    return new Response(null, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        Location: authorizationUrl({clientId, context}),
        'Referrer-Policy': 'no-referrer',
        'Set-Cookie': createStateCookie(context),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const details = errorDetails(error);
    return createStandaloneErrorResponse(details.message, details.status);
  }
}

export async function handleCallback(
  request,
  env = process.env,
  fetchImpl = fetch,
) {
  const url = new URL(request.url);
  const context = readOAuthContext(request);

  try {
    validateContext(
      context,
      url.searchParams.get('state'),
      env.CMS_ALLOWED_ORIGINS,
    );

    if (url.searchParams.get('error')) {
      throw new OAuthRequestError(
        'GitHub authorization was cancelled or denied.',
      );
    }

    const code = url.searchParams.get('code');
    if (!code || code.length > 512) {
      throw new OAuthRequestError(
        'GitHub did not return a valid authorization code.',
      );
    }

    const {clientId, clientSecret} = requireOAuthEnvironment(env);
    const token = await exchangeCodeForToken({
      clientId,
      clientSecret,
      code,
      fetchImpl,
      verifier: context.verifier,
    });

    return createPopupResponse({
      origin: context.origin,
      status: 'success',
      data: {provider: OAUTH_PROVIDER, token},
    });
  } catch (error) {
    const details = errorDetails(error);
    if (
      context &&
      isAllowedSiteOrigin(context.origin, env.CMS_ALLOWED_ORIGINS)
    ) {
      return createPopupResponse({
        origin: context.origin,
        status: 'error',
        data: {message: details.message},
      });
    }
    return createStandaloneErrorResponse(details.message, details.status);
  }
}
