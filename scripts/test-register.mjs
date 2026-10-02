import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true };
    if (specifier.startsWith('@/')) specifier = pathToFileURL(path.join(root, specifier.slice(2))).href;
    if (specifier.startsWith('.') || specifier.startsWith('file:')) {
      const url = new URL(specifier, context.parentURL);
      for (const suffix of ['', '.ts', '.tsx', '/index.ts']) {
        if (existsSync(fileURLToPath(url) + suffix) && /\.(ts|tsx)$/.test(url.pathname + suffix)) return { url: url.href + suffix, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (/\.(ts|tsx)$/.test(url) && !url.includes('/node_modules/')) return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText, shortCircuit: true };
    return next(url, context);
  },
});
