const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const inputs = JSON.parse(fs.readFileSync(path.join(root, 'cost-inputs.json'), 'utf8'));
function evaluate(p, s, tax, active = 0, paidShare = 0) {
  assert(Number.isFinite(tax) && tax >= 0);
  assert(Number.isInteger(active) && active >= 0);
  assert(paidShare >= 0 && paidShare <= 1);
  const aiReply = (p.input_tokens_per_reply * p.input_price_per_million_assumption + p.output_tokens_per_reply * p.output_price_per_million_assumption) / 1e6;
  const payment = p.gross_monthly_price * p.payment_percent_assumption + p.payment_fixed_assumption;
  const netRevenue = p.gross_monthly_price / (1 + tax);
  const free = s.free_replies * aiReply + s.free_support_minutes * p.support_hourly_cost_assumption / 60 + s.free_variable_infra;
  const premium = s.premium_replies * aiReply + s.premium_support_minutes * p.support_hourly_cost_assumption / 60 + s.premium_variable_infra;
  const premiumContribution = netRevenue - payment - premium;
  const blendedContribution = paidShare * premiumContribution - (1 - paidShare) * free;
  const paid = Math.round(active * paidShare);
  const totalCost = s.fixed_monthly + (active - paid) * free + paid * (premium + payment);
  return {
    scenario: s.name, tax, active_users: active, paid_share: paidShare, paid_users: paid,
    ai_cost_per_reply: aiReply, net_revenue_per_paid: netRevenue, payment_cost_per_paid: payment,
    free_variable_cost: free, premium_variable_cost_ex_payment: premium,
    contribution_per_paid_before_free_and_fixed: premiumContribution,
    blended_contribution_per_active: blendedContribution,
    monthly_operating_cost: totalCost,
    monthly_net_revenue: paid * netRevenue,
    monthly_result_before_exclusions: paid * netRevenue - totalCost,
    break_even_active_at_share_continuous_approx: blendedContribution > 0 ? Math.ceil(s.fixed_monthly / blendedContribution) : null,
    conservative_break_even_active_with_rounding: blendedContribution > 0 ? Math.ceil((s.fixed_monthly + Math.max(0, premiumContribution + free) / 2) / blendedContribution) : null,
    minimum_paid_share_before_fixed: premiumContribution + free > 0 ? free / (premiumContribution + free) : null
  };
}
// Arithmetic boundary checks: tax is removed from gross once, no AI charge for zero replies,
// and negative contribution yields no finite break-even.
const light = inputs.scenarios[0];
assert(Math.abs(evaluate(inputs, light, 0.23).net_revenue_per_paid - 5 / 1.23) < 1e-12);
const zeroUsage = {...light, free_replies: 0, premium_replies: 0, free_support_minutes: 0, premium_support_minutes: 0, free_variable_infra: 0, premium_variable_infra: 0};
assert.equal(evaluate(inputs, zeroUsage, 0).free_variable_cost, 0);
assert.equal(evaluate(inputs, inputs.scenarios[2], 0.23, 100, 0.05).break_even_active_at_share_continuous_approx, null);
const results = [];
for (const s of inputs.scenarios) for (const tax of inputs.tax_sensitivities) for (const pop of inputs.population_cases) results.push(evaluate(inputs, s, tax, pop.active_users, pop.paid_share));
fs.writeFileSync(path.join(root, 'cost-results.json'), JSON.stringify({date: inputs.date, status: inputs.status, formula: 'net_revenue=paid*gross/(1+tax); result=net_revenue-fixed-free_cost*free_users-(premium_cost+fee)*paid', rounding_caveat: 'Continuous break-even assumes fractional paid users; monthly results round paid count. Conservative threshold covers worst-case loss from rounding, not earliest profitable population.', results}, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({checks: 'passed', cases: results.length, tax_23_population_1000: results.filter(x => x.tax === 0.23 && x.active_users === 1000)}, null, 2));
