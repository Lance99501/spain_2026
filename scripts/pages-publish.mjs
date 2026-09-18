import {createHash} from 'node:crypto';
import {appendFile, readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const publicFiles = ['data/generated/bootstrap.json', 'service-worker.js', 'index.html'];
const digest = value => createHash('sha256').update(value).digest('hex');

// Dependency injection keeps deployment tests offline: no real build or secret is needed.
export async function publishPages({api, readPublic, expected, sha, wait, attempts = 40}) {
  const site = await api('GET', '/pages');
  if (site.build_type !== 'legacy' || site.source?.branch !== 'main' || site.source?.path !== '/') {
    throw new Error('Expected existing branch-based Pages from main:/; review Pages settings before deploying.');
  }
  const assertCurrent = async () => {
    const head = await api('GET', '/git/ref/heads/main');
    if (head.object?.sha !== sha) throw new Error('Main advanced; this deployment was superseded. Retry Deploy on current main.');
  };
  const matches = async () => {
    const results = await Promise.all(publicFiles.map(async path => {
      try { return digest(await readPublic(site.html_url, path)) === digest(expected[path]); }
      catch { return false; }
    }));
    return results.every(Boolean);
  };
  await assertCurrent();
  if (await matches()) return {state: 'already-current', sha, url: site.html_url};

  // GITHUB_TOKEN pushes do not start Pages builds. Explicitly request one using pages:write.
  await api('POST', '/pages/builds');
  for (let attempt = 0; attempt < attempts; attempt++) {
    await assertCurrent();
    const build = await api('GET', '/pages/builds/latest');
    if (build.commit === sha) {
      if (build.status === 'errored' || build.status === 'error') throw new Error('Pages build failed for the published commit.');
      if (build.status === 'built' && await matches()) return {state: 'deployed', sha, url: site.html_url};
    }
    if (attempt + 1 < attempts) await wait();
  }
  throw new Error('Pages deployment timed out or live files do not match. The data commit remains; retry Mode=Deploy.');
}

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN;
  if (!repository || !token) throw new Error('GITHUB_REPOSITORY and GH_TOKEN are required.');
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  const expected = Object.fromEntries(await Promise.all(publicFiles.map(async path => [path, await readFile(path)])));
  const api = async (method, path) => {
    const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
      method, headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'},
      signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`GitHub Pages API ${method} ${path} failed (${response.status}).`);
    return response.json();
  };
  const readPublic = async (base, path) => {
    const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
    url.searchParams.set('verify', `${sha}-${Date.now()}`);
    // Never send the GitHub token to the public website.
    const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`Public file unavailable (${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  };
  const result = await publishPages({api, readPublic, expected, sha, wait: () => new Promise(resolve => setTimeout(resolve, 15000))});
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `state=${result.state}\nsha=${sha}\nurl=${result.url}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY,
    `\n## Pages verified\n\n- Result: ${result.state}\n- Commit checked: ${sha}\n- Live bootstrap, service worker and index match the checkout byte-for-byte.\n- Website: ${result.url}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(async error => {
    console.error(`::error::${error.message}`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n## Pages NOT verified\n\n${error.message}\nDo not report the data commit as a successful website update.\n`);
    process.exitCode = 1;
  });
}
