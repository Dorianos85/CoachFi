const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, ''));
const pilot = read('docs/coachfi/content/quiz-pilot-24.json');
assert.equal(pilot.questions.length, 24);
assert.equal(new Set(pilot.questions.map(q => q.id)).size, 24);
assert.equal(pilot.count_language_renderings, 48);
const domains = {}, levels = {};
for (const q of pilot.questions) {
  domains[q.domain] = (domains[q.domain] || 0) + 1;
  levels[q.level] = (levels[q.level] || 0) + 1;
  for (const key of ['id','objective','domain','level','languages','jurisdiction','type','prompt','correct_answer','rationale','explanations','sources','review_date','calculation_assumptions','version','status','reviewer']) assert(key in q, `${q.id}: missing ${key}`);
  for (const language of ['pl','en']) {
    assert(q.prompt[language]?.length > 0);
    assert(q.rationale[language]?.length > 0);
    assert(q.objective[language]?.length > 0);
  }
  assert.equal(q.status, 'draft_for_review');
  assert(q.sources.length > 0);
  assert.equal(q.reviewer, 'architecture_audit');
  if (q.correct_answer.option_id) assert(q.options.some(o => o.id === q.correct_answer.option_id));
  else assert(Number.isFinite(q.correct_answer.value));
}
assert.equal(Object.keys(domains).length, 8);
assert(Object.values(domains).every(n => n === 3));
assert.equal(Object.keys(levels).length, 3);
assert(Object.values(levels).every(n => n === 8));
const backlog = read('docs/coachfi/backlog.json');
assert.equal(new Set(backlog.tasks.map(t => t.id)).size, backlog.tasks.length);
for (const t of backlog.tasks) {
  assert(t.problem && t.result && t.acceptance_criteria);
  assert(t.owner_role >= 1 && t.owner_role <= 23 && t.reviewer_role >= 1 && t.reviewer_role <= 23);
  assert.notEqual(t.owner_role, t.reviewer_role);
  assert(t.dependencies.every(id => backlog.tasks.some(x => x.id === id)));
}
const skills = read('docs/coachfi/skill-specifications.json');
assert.equal(skills.skills.length, 24);
for (const s of skills.skills) {
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills', s.name, 'SKILL.md'), 'utf8'), s.content);
  assert(fs.existsSync(path.join(root, 'docs/coachfi/program.md')));
}
const official = read('evidence/skill-validation.json');
assert.equal(official.length, 24);
assert(official.every(x => x.exit_code === 0));
assert.equal(read('docs/coachfi/cost-results.json').results.length, 27);
assert.equal(read('docs/coachfi/mila-evaluation-cases.json').cases.length, 16);
const architecture = read('evidence/architecture.json');
assert.equal(new Set(architecture.evidence.map(e => e.id)).size, architecture.evidence.length);
const result = {date:'2026-10-14', status:'passed', pilot_items:24, language_renderings:48, domains, levels, backlog_tasks:backlog.tasks.length, skill_manifests:24, official_skill_validation:24, cost_scenarios:27, mila_cases:16, limitations:['Structural checks are not content/source/user validation.', 'No production mutations or exploits.']};
fs.writeFileSync(path.join(root, 'evidence/delivery-validation.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
