import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { proxy } from './proxy';

test('a visitor without a session is redirected to login', () => {
  const response = proxy(new NextRequest('https://react.epixum.com/'));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://react.epixum.com/login');
});

test('the login page remains available when the auth cookie is stale', () => {
  const request = new NextRequest('https://react.epixum.com/login', {
    headers: { cookie: 'pb_auth=stale-session' },
  });

  const response = proxy(request);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('location'), null);
  assert.equal(response.headers.get('x-middleware-next'), '1');
});
