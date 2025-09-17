#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

const platformCandidates = (() => {
  switch (process.platform) {
    case 'linux':
      return ['@rslint/linux-x64'];
    case 'darwin':
      return ['@rslint/darwin-arm64', '@rslint/darwin-x64'];
    case 'win32':
      return ['@rslint/win32-x64', '@rslint/win32-ia32'];
    default:
      return [];
  }
})();
platformCandidates.push('@rslint/cli');

function resolveBinary(pkgName) {
  try {
    const pkgPath = require.resolve(`${pkgName}/package.json`, { paths: [process.cwd()] });
    const pkgDir = dirname(pkgPath);
    const manifest = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (manifest.bin) {
      const binField = typeof manifest.bin === 'string' ? { [pkgName]: manifest.bin } : manifest.bin;
      for (const rel of Object.values(binField)) {
        const candidate = resolve(pkgDir, rel);
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
    const fallback = resolve(pkgDir, 'rslint');
    if (existsSync(fallback)) {
      return fallback;
    }
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      console.warn(`[rslint] Failed to resolve ${pkgName}:`, error.message);
    }
  }
  return null;
}

const binary = platformCandidates.map(resolveBinary).find(Boolean);

if (!binary) {
  console.error('[rslint] 未找到可执行的 RSLint 二进制文件，请确认已安装对应平台的 @rslint/* 依赖。');
  process.exit(1);
}

const finalArgs = process.argv.slice(2);
const hasExplicitPath = finalArgs.some(arg => !arg.startsWith('-'));

if (!hasExplicitPath) {
  finalArgs.push('src', 'tests');
}

const child = spawn(binary, finalArgs, {
  stdio: 'inherit',
});

child.on('error', error => {
  console.error('[rslint] 运行失败：', error.message);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 1);
});
