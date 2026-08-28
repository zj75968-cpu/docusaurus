/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// eslint-disable-next-line vitest/no-import-node-test
import test from 'node:test';
import {
  createPopupResponse,
  handleAuthorize,
  handleCallback,
  isAllowedSiteOrigin,
  resolveSiteOrigin,
  safeEqual,
} from './_oauth.mjs';

const env = {
  GITHUB_CLIENT_ID: 'test-client-id',
  GITHUB_CLIENT_SECRET: 'test-client-secret',
};

test('allows production and project preview origins only', () => {
  assert.equal(isAllowedSiteOrigin('https://kb.n8nmydomain.com'), true);
  assert.equal(
    isAllowedSiteOrigin('https://docusaurus-knowledge-base.vercel.app'),
    true,
  );
  assert.equal(
    isAllowedSiteOrigin(
      'https://docusaurus-knowledge-base-efzyvylkd-12222as-projects.vercel.app',
    ),
    true,
  );
  assert.equal(isAllowedSiteOrigin('https://example.com'), false);
  assert.equal(isAllowedSiteOrigin('http://kb.n8nmydomain.com'), false);
});

test('resolves validated Decap site identifiers', () => {
  assert.equal(
    resolveSiteOrigin('kb.n8nmydomain.com'),
    'https://kb.n8nmydomain.com',
  );
  assert.throws(() => resolveSiteOrigin('example.com'), /not allowed/);
  assert.throws(
    () => resolveSiteOrigin('kb.n8nmydomain.com/path'),
    /not allowed/,
  );
});

test('compares OAuth state without accepting type or length mismatches', () => {
  assert.equal(safeEqual('same-state', 'same-state'), true);
  assert.equal(safeEqual('same-state', 'other-state'), false);
  assert.equal(safeEqual('short', 'longer'), false);
  assert.equal(safeEqual(undefined, 'state'), false);
});

test('authorize response uses PKCE and a secure host cookie', async () => {
  const response = handleAuthorize(
    new Request(
      'https://kb.n8nmydomain.com/api/auth?provider=github&site_id=kb.n8nmydomain.com',
    ),
    env,
  );
  const location = new URL(response.headers.get('location'));
  const cookie = response.headers.get('set-cookie');

  assert.equal(response.status, 302);
  assert.equal(location.origin, 'https://github.com');
  assert.equal(
    location.searchParams.get('redirect_uri'),
    'https://kb.n8nmydomain.com/api/callback',
  );
  assert.equal(location.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(location.searchParams.get('scope'), 'public_repo');
  assert.match(cookie, /^__Host-decap_oauth=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
});

test('popup handshake targets only the validated CMS origin', async () => {
  const response = createPopupResponse({
    origin: 'https://kb.n8nmydomain.com',
    status: 'success',
    data: {provider: 'github', token: 'test-token'},
  });
  const html = await response.text();

  assert.match(html, /authorization:github:success/);
  assert.match(html, /event\.origin !== targetOrigin/);
  assert.match(html, /event\.source !== openerWindow/);
  assert.doesNotMatch(html, /postMessage\([^,]+,\s*['"]\*['"]\)/);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
});

test('callback validates state and exchanges the code with the PKCE verifier', async () => {
  const authorizeResponse = handleAuthorize(
    new Request(
      'https://kb.n8nmydomain.com/api/auth?provider=github&site_id=kb.n8nmydomain.com',
    ),
    env,
  );
  const authorizeLocation = new URL(authorizeResponse.headers.get('location'));
  const state = authorizeLocation.searchParams.get('state');
  const cookie = authorizeResponse.headers.get('set-cookie').split(';', 1)[0];
  let tokenRequest;

  const response = await handleCallback(
    new Request(
      `https://kb.n8nmydomain.com/api/callback?code=test-code&state=${encodeURIComponent(state)}`,
      {headers: {cookie}},
    ),
    env,
    async (url, options) => {
      tokenRequest = {url, options};
      return Response.json({access_token: 'test-token'});
    },
  );
  const tokenBody = new URLSearchParams(tokenRequest.options.body);
  const verifier = tokenBody.get('code_verifier');
  const expectedChallenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');
  const html = await response.text();

  assert.equal(tokenRequest.url, 'https://github.com/login/oauth/access_token');
  assert.equal(tokenRequest.options.method, 'POST');
  assert.equal(tokenBody.get('code'), 'test-code');
  assert.equal(tokenBody.get('client_secret'), 'test-client-secret');
  assert.equal(
    expectedChallenge,
    authorizeLocation.searchParams.get('code_challenge'),
  );
  assert.match(html, /authorization:github:success/);
  assert.match(html, /test-token/);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
});

test('callback rejects a mismatched state before exchanging the code', async () => {
  const authorizeResponse = handleAuthorize(
    new Request(
      'https://kb.n8nmydomain.com/api/auth?provider=github&site_id=kb.n8nmydomain.com',
    ),
    env,
  );
  const cookie = authorizeResponse.headers.get('set-cookie').split(';', 1)[0];
  let exchangeAttempted = false;

  const response = await handleCallback(
    new Request(
      'https://kb.n8nmydomain.com/api/callback?code=test-code&state=invalid-state',
      {headers: {cookie}},
    ),
    env,
    async () => {
      exchangeAttempted = true;
      return Response.json({access_token: 'must-not-be-used'});
    },
  );
  const html = await response.text();

  assert.equal(exchangeAttempted, false);
  assert.match(html, /authorization:github:error/);
  assert.doesNotMatch(html, /must-not-be-used/);
});

test('callback handles missing cookies as invalid OAuth state', async () => {
  const response = await handleCallback(
    new Request(
      'https://kb.n8nmydomain.com/api/callback?code=test-code&state=test-state',
    ),
    env,
  );
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /OAuth state is missing or does not match/);
});

test('callback handles malformed cookies as invalid OAuth state', async () => {
  const response = await handleCallback(
    new Request(
      'https://kb.n8nmydomain.com/api/callback?code=test-code&state=test-state',
      {headers: {cookie: '__Host-decap_oauth=%E0%A4%A'}},
    ),
    env,
  );
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /OAuth state is missing or does not match/);
});
