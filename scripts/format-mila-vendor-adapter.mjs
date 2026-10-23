// Formatting-only preparation for the reviewed, local 0.19.0 lifecycle adapter.
// It adds line breaks at three exact expressions; unknown versions fail closed.
import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../public/elevenlabs/convai-widget.js", import.meta.url);
let source = readFileSync(path, "utf8");
const expressions = process.argv.includes("--preflight") ? [
  'if(await u.requestTerms(),e.current?.isOpen())return e.current.getId();',
  'if(t.current=_v.startSession({',
] : [
  'Dh(()=>()=>{e.current?.endSession(),f()},[])',
  'onStatusChange:e=>{p.value=e.status}',
  'S.value++,e.reason===`error`&&!t&&(_.value=e.message,console.error(`[ConversationalAI] Disconnected due to an error:`,e.message))',
];
for (const expression of expressions) {
  if (source.split(expression).length !== 2) throw new Error("Unexpected vendor version; review required");
  source = source.replace(expression, `\n${expression}\n`);
}
writeFileSync(path, source);
console.log(`Formatted ${expressions.length} verified expressions; no semantic changes.`);
