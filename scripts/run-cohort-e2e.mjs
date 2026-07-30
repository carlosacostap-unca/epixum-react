import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const testRoot = resolve(root, '.tools', 'pocketbase-test');
const dataDir = resolve(testRoot, 'cohort-e2e-data');
const pocketBaseBinary = process.env.POCKETBASE_TEST_BINARY
  ? resolve(process.env.POCKETBASE_TEST_BINARY)
  : resolve(testRoot, process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const pocketBaseUrl = 'http://127.0.0.1:8094';
const appUrl = 'http://127.0.0.1:3100';
const adminEmail = 'e2e-admin@epixum.local';
const adminPassword = 'EpixumE2EAdmin1234!';
const children = [];

function assertSafeDataDir() {
  const child = relative(testRoot, dataDir);
  if (!child || child.startsWith('..') || resolve(dirname(dataDir)) !== testRoot) {
    throw new Error(`Unsafe E2E data directory: ${dataDir}`);
  }
}

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`);
}

async function waitFor(url, label, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

function stopTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    child.kill('SIGTERM');
  }
}

async function cleanup() {
  for (const child of [...children].reverse()) stopTree(child);
  if (children.length > 0) await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000));
  assertSafeDataDir();
  for (let attempt = 1; existsSync(dataDir); attempt += 1) {
    try {
      rmSync(dataDir, { recursive: true, force: true });
    } catch (error) {
      if (attempt >= 20) {
        console.warn(`Could not remove temporary E2E data immediately: ${error instanceof Error ? error.message : error}`);
        break;
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
    }
  }
}

async function main() {
  if (!existsSync(pocketBaseBinary)) {
    throw new Error(`PocketBase test binary not found: ${pocketBaseBinary}`);
  }
  assertSafeDataDir();
  if (existsSync(dataDir)) rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true });

  run(pocketBaseBinary, ['superuser', 'create', adminEmail, adminPassword, `--dir=${dataDir}`]);
  const pocketBase = spawn(pocketBaseBinary, ['serve', '--http=127.0.0.1:8094', '--automigrate=false', `--dir=${dataDir}`], {
    cwd: dataDir,
    stdio: 'inherit',
  });
  children.push(pocketBase);
  await waitFor(`${pocketBaseUrl}/api/health`, 'PocketBase');

  const testEnv = {
    NEXT_PUBLIC_POCKETBASE_URL: pocketBaseUrl,
    POCKETBASE_ADMIN_EMAIL: adminEmail,
    POCKETBASE_ADMIN_PASSWORD: adminPassword,
    POCKETBASE_TEST_SEED_APPROVED: 'true',
    POCKETBASE_COHORT_MIGRATION_APPROVED: 'true',
  };
  run(npm, ['run', 'pb:cohorts:seed-test'], testEnv);
  run(npm, ['run', 'pb:cohorts:migrate', '--', '--apply'], testEnv);
  run(npm, ['run', 'pb:cohorts:finalize', '--', '--apply'], testEnv);
  run(npm, ['run', 'pb:cohorts:seed-e2e'], testEnv);
  run(npm, ['run', 'pb:cohorts:test-permissions'], testEnv);

  const next = spawn(process.execPath, [resolve(root, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '--hostname', '127.0.0.1', '--port', '3100'], {
    cwd: root,
    env: { ...process.env, ...testEnv },
    stdio: 'inherit',
  });
  children.push(next);
  await waitFor(`${appUrl}/login`, 'Next.js');
  run(npx, ['playwright', 'test'], { ...testEnv, E2E_BASE_URL: appUrl });
}

process.once('SIGINT', () => { void cleanup().finally(() => process.exit(130)); });
process.once('SIGTERM', () => { void cleanup().finally(() => process.exit(143)); });

let failure;
try {
  await main();
} catch (error) {
  failure = error;
} finally {
  await cleanup();
}
if (failure) throw failure;
