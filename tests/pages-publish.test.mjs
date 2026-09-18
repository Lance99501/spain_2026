import assert from 'node:assert/strict';
import {test} from 'node:test';
import {publishPages} from '../scripts/pages-publish.mjs';

function fixture({live = false, head = 'abc', build = {commit: 'abc', status: 'built'}, settings = {}} = {}) {
  let requested = false;
  const calls = [];
  const expected = {'data/generated/bootstrap.json': 'new-data', 'service-worker.js': 'new-cache', 'index.html': 'page'};
  return {calls, options: {
    sha: 'abc', expected, attempts: 2, wait: async () => {},
    api: async (method, path) => {
      calls.push(`${method} ${path}`);
      if (path === '/pages') return {build_type: 'legacy', source: {branch: 'main', path: '/'}, html_url: 'https://example.test/trip/', ...settings};
      if (path === '/git/ref/heads/main') return {object: {sha: head}};
      if (method === 'POST') { requested = true; return {status: 'queued'}; }
      return build;
    },
    readPublic: async (_, path) => (live || requested) ? expected[path] : 'stale'
  }};
}

test('no-change retry repairs a stale website and verifies the exact data', async () => {
  const f = fixture();
  assert.equal((await publishPages(f.options)).state, 'deployed');
  assert.equal(f.calls.filter(call => call === 'POST /pages/builds').length, 1);
});
test('already-current public files do not trigger another build', async () => {
  const f = fixture({live: true});
  assert.equal((await publishPages(f.options)).state, 'already-current');
  assert.ok(!f.calls.some(call => call.startsWith('POST')));
});
test('a newer main prevents stale deployment', async () => {
  const f = fixture({head: 'newer'});
  await assert.rejects(publishPages(f.options), /superseded/);
  assert.ok(!f.calls.some(call => call.startsWith('POST')));
});
test('a successful build for an older commit is not accepted', async () => {
  await assert.rejects(publishPages(fixture({build: {commit: 'old', status: 'built'}}).options), /timed out/);
});
test('build failure is reported instead of claiming website success', async () => {
  await assert.rejects(publishPages(fixture({build: {commit: 'abc', status: 'errored'}}).options), /build failed/);
});
test('a built commit with stale public files is not accepted', async () => {
  const f = fixture(); f.options.readPublic = async () => 'stale';
  await assert.rejects(publishPages(f.options), /live files do not match/);
});
test('unexpected Pages source requires review', async () => {
  const f = fixture({settings: {build_type: 'workflow'}});
  await assert.rejects(publishPages(f.options), /review Pages settings/);
  assert.ok(!f.calls.some(call => call.startsWith('POST')));
});
