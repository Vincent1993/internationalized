#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);

function resolveRslintBinary() {
  try {
    const entry = require.resolve('@rslint/core/bin/rslint.cjs', { paths: [process.cwd()] });
    if (existsSync(entry)) {
      return entry;
    }
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND' && error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      console.warn('[rslint] Failed to resolve default binary:', error.message);
    }
  }

  try {
    const pkgPath = require.resolve('@rslint/core/package.json', { paths: [process.cwd()] });
    const pkgDir = dirname(pkgPath);
    const manifest = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const binField = manifest?.bin;
    if (typeof binField === 'string') {
      const candidate = resolve(pkgDir, binField);
      if (existsSync(candidate)) {
        return candidate;
      }
    } else if (binField && typeof binField === 'object') {
      const candidate = binField.rslint ?? Object.values(binField)[0];
      if (candidate) {
        const resolved = resolve(pkgDir, candidate);
        if (existsSync(resolved)) {
          return resolved;
        }
      }
    }
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      console.warn('[rslint] Failed to read @rslint/core manifest:', error.message);
    }
  }

  return null;
}

const binary = resolveRslintBinary();

if (!binary) {
  console.error('[rslint] 未找到可执行的 RSLint 入口，请确认已安装 @rslint/core 依赖。');
  process.exit(1);
}

const finalArgs = process.argv.slice(2);
const hasExplicitPath = finalArgs.some(arg => !arg.startsWith('-'));

if (!hasExplicitPath) {
  finalArgs.push('src', 'tests');
}

const child = spawn(process.execPath, [binary, ...finalArgs], {
  stdio: 'inherit',
});

child.on('error', error => {
  console.error('[rslint] 运行失败：', error.message);
  process.exit(1);
});

child.on('exit', code => {
  process.exit(code ?? 1);
});
