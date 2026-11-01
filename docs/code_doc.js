const { D, parse, table } = require('./lib.js');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak, Footer, PageNumber } = D;
const fs = require('fs');
const R = f => fs.readFileSync('../' + f, 'utf8').replace(/\t/g, '    ');
const body = (t, o = {}) => new Paragraph({ spacing: { after: 100, line: 276 }, children: parse(t, { font: 'Calibri', size: 22 }), ...o });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 }, children: [new TextRun({ text: t, font: 'Calibri', bold: true, size: 32 })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: t, font: 'Calibri', bold: true, size: 26 })] });
const codeBlock = txt => txt.replace(/\n$/, '').split('\n').map(l => new Paragraph({ spacing: { after: 0, line: 220 }, shading: { type: D.ShadingType.CLEAR, fill: 'F4F4F4', color: 'auto' },
  children: [new TextRun({ text: l === '' ? ' ' : l, font: 'Courier New', size: 16 })] }));

const files = [
  ['flsel/__init__.py', 'Package description.'],
  ['flsel/instance.py', 'Instance dataclass and random generator. Implements the plan-of-attack step 2: 2–4 groups per client, log-normal times, energy proportional to time, deadline at the 70% quantile.'],
  ['flsel/checker.py', 'Independent feasibility checker. Recomputes the battery trajectory, deadline, cardinality, energy budget, fairness and the objective from the 0/1 selection matrix only; every result in the study passes through it.'],
  ['flsel/greedy.py', 'Single-round algorithms: plain (cardinality) greedy, ratio greedy, modified greedy (ratio greedy vs best single client) and partial enumeration of size 3.'],
  ['flsel/ilp.py', 'Exact models with HiGHS: single-round budgeted-coverage ILP (and LP relaxation) and the multi-round ILP with overflow slack, fairness constraint, presolve fixings and cumulative-energy cuts. Also used on a window for the rolling-horizon policy.'],
  ['flsel/policies.py', 'Selection policies (random, fastest-first, myopic greedy, battery-aware greedy, rolling ILP), the round simulator and all metrics (coverage, full-coverage rounds, exhausted clients, Jain index, overflow).'],
  ['flsel/fedavg.py', 'Optional ML link: numpy FedAvg with softmax regression on a non-IID split of the scikit-learn digits data.'],
  ['run_e0_reduction_check.py', 'E0: verifies the Set Cover reduction (Theorem 1) against brute force.'],
  ['run_e1_single_round.py', 'E1: ILP vs brute force, greedy ratios vs ILP and LP bound, tight example for ratio greedy.'],
  ['run_e2_multiround_small.py', 'E2: small instances; every policy vs the exact multi-round ILP; strengthening comparison.'],
  ['run_e3_large.py', 'E3: large instances vs the battery-free upper bound; run-time scaling.'],
  ['run_e4_gamma.py', 'E4: sweep of the price weight γ and of the recharge scale.'],
  ['run_e5_adversarial.py', 'E5: adversarial family for the myopic greedy (Proposition 3).'],
  ['run_e6_fairness.py', 'E6: fairness variant solved exactly.'],
  ['run_e7_fedavg.py', 'E7: coverage vs FedAvg accuracy.'],
  ['make_figures.py', 'Wide figures and the table JSON.'],
  ['make_figures_col.py', 'Single-column figures used in the two-column paper.'],
  ['export_numbers.py', 'Collects every number quoted in the paper into results/numbers.json.'],
  ['run_all.sh', 'Runs everything in order.'],
  ['README.md', 'Setup and layout.'],
];
const ch = [];
ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 200 }, children: [new TextRun({ text: 'PS–7: Energy-Aware Client Selection in Federated Learning', font: 'Calibri', bold: true, size: 44 })] }));
ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Complete Python Implementation and Code Listings', font: 'Calibri', size: 32 })] }));
ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: 'Advanced Algorithms Project · RGIPT · AY 2026–27', font: 'Calibri', size: 24, italics: true })] }));
ch.push(h1('1. How to use this document'));
ch.push(body('This document contains every line of the code used in the study. The same files are in the accompanying zip (`PS7_code_and_results.zip`), which also holds the raw result tables and figures. Copy the files into a folder, install the requirements, and run `sh run_all.sh`.'));
ch.push(body('**Requirements:** Python 3, numpy, scipy (≥ 1.9, for `scipy.optimize.milp` which calls the open-source HiGHS solver), pandas, matplotlib and scikit-learn (only for the digits data set in E7). No commercial solver is needed.'));
ch.push(h1('2. File overview'));
ch.push(table([['File', 'Purpose'], ...files.map(f => [f[0], f[1]])], [3000, 6026], { size: 18, leftCols: [1] }));
ch.push(body(''));
ch.push(h1('3. Design notes'));
ch.push(body('**Checker first.** Every selection matrix returned by any policy or ILP is passed through `checker.check`, which does not share code with the ILP or the policies. The simulator asserts feasibility, so an infeasible schedule can never silently enter a table.'));
ch.push(body('**Battery convention.** The battery at the start of round *t* is b; after selection x it becomes min(β, b − e·x + ρ_t). A client can participate only if b ≥ e. This matches ILP constraints (4)–(5) of the paper.'));
ch.push(body('**Price versus cost.** In the greedy functions the argument `cost` is the price used only to rank clients; the budget and battery tests always use the true energy `e`. This is why the battery-aware algorithm is always feasible.'));
ch.push(body('**Upper bound.** For large instances the exact multi-round ILP is too slow, so the code computes the sum over rounds of the single-round optimum with batteries ignored; this is a valid upper bound on the multi-round optimum.'));
ch.push(body('**Seeds.** Each experiment fixes its seeds (instances 200+ for E2, 300+ E3, 400+ E4, 500+ scarcity, 600+ E6, 700+ E7), so results can be reproduced up to solver time-limit effects in E2 (K=30).'));
let n = 4;
for (const [f, d] of files) {
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1(`${n++}. ${f}`));
  ch.push(body(d));
  ch.push(...codeBlock(R(f)));
}
const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [{ id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Calibri' }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Calibri' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT], size: 18, font: 'Calibri' })] })] }) },
    children: ch }],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync('/mnt/user-data/outputs/PS7_Code_Listings.docx', b); console.log('ok'); });
