const { D, parse, img, table } = require('./lib.js');
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak, Footer, PageNumber, LevelFormat } = D;
const fs = require('fs');
const N = JSON.parse(fs.readFileSync('../results/numbers.json'));
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), f3 = x => x.toFixed(3);
const C = { font: 'Calibri', size: 22 };
const p = t => new Paragraph({ spacing: { after: 110, line: 288 }, children: parse(t, C) });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 }, children: [new TextRun({ text: t, ...C, bold: true, size: 32 })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, keepNext: true, children: [new TextRun({ text: t, ...C, bold: true, size: 26 })] });
const b = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60, line: 276 }, children: parse(t, C) });
const box = t => table([[t]], [9026], { noHeader: true, size: 21, rowFill: () => 'EAF2FB' });
const pic = (f, w, h, c) => [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 40 }, keepNext: true, children: [img('../figures/' + f, w, h)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: parse(c, { ...C, size: 18, italics: true }) })];
const sp = () => new Paragraph({ children: [] });
const e1k = N.e1.knapsack_only, e1m = N.e1.with_cardinality_m5, e2 = N.e2, e3 = N.e3, p3 = N.e3_paired;
const A = e3.K100_G30_R30, Bc = e3.K60_G12_R20, g4 = N.e4, sc = N.e4_scarcity;
const ch = [];

ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1000, after: 200 }, children: [new TextRun({ text: 'PS–7 Project Guide', ...C, bold: true, size: 52 })] }));
ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Energy-Aware Client Selection in Federated Learning', ...C, size: 34 })] }));
ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'An easy, step-by-step explanation of everything that was done: the problem, the full pipeline, every result, every reference and viva preparation', ...C, size: 24, italics: true })] }));
ch.push(box('**Deliverables.** (1) `PS7_Research_Paper.docx` – the 6-page two-column conference paper. (2) `PS7_Code_Listings.docx` – all Python code. (3) `PS7_code_and_results.zip` – runnable code, raw results and figures. (4) This guide. **Before submitting:** replace the placeholder author names in the paper, and read the “Honesty notes” section so you can defend every claim.'));
ch.push(sp());

ch.push(h1('1. The project in plain words'));
ch.push(p('Imagine a teacher who wants to learn about the whole class but can only ask a few students per day. Each student knows about some topics (their *data groups*). Some students are quick, some slow, and each has a phone battery that drains when they help and slowly recharges. A student cannot help if the battery is too low or if they are too slow for the deadline. The teacher wants, over many days, to hear about as many topics as possible, without exhausting the same few students every day.'));
ch.push(p('That is **client selection in federated learning (FL)**. The server is the teacher, the clients are phones or hospitals, the topics are data groups (for example the digit classes 0–9), and a “round” is one day. The *usefulness* of a round is the total weight of topics covered by at least one chosen client.'));
ch.push(h2('The mathematical problem in one paragraph'));
ch.push(p('Choose, in every round *t*, a set of clients so that (a) their total weight of covered groups is large, (b) every chosen client is fast enough (time ≤ deadline), (c) at most *m* clients are chosen, (d) the total energy used ≤ the round budget, and (e) each chosen client has enough battery. A client’s battery goes down by its energy cost when chosen and goes up by its recharge after each round (never above its capacity). Maximise the sum of coverage over all rounds.'));
ch.push(h2('A tiny worked example'));
ch.push(p('Groups: {A, B, C, D}, all weight 1. Client 1 holds {A, B}, client 2 holds {B, C}, client 3 holds {C, D}. Each costs 1 energy, and we may pick 2 clients per round. Picking clients 1 and 3 covers all four groups (value 4). Picking 1 and 2 covers only {A, B, C} (value 3). This choice is exactly *Maximum Coverage*. Now add batteries: if client 1 and 3 can each take part only once in two rounds, then round 2 must use other clients and the value drops. This coupling between rounds is what makes the multi-round problem more interesting than a single round.'));

ch.push(h1('2. What the professor asked for and where it is covered'));
ch.push(table([
  ['Requirement (from the PS document)', 'Where it is done'],
  ['1. Problem formalisation with notation and assumptions', 'Paper Section III (notation, assumptions A1–A6); this guide Section 3'],
  ['2. Complexity analysis (NP-hardness by reduction)', 'Paper Section IV (Theorem 1 from Set Cover, Corollary 1); verified by `run_e0_reduction_check.py` (632/632 agree)'],
  ['3. Exact ILP/MILP implemented, verified, possibly strengthened, open-source solver', '`flsel/ilp.py` with HiGHS; verified against brute force (E1) and the checker; strengthening tried (E2) – it gave no speed-up, reported honestly'],
  ['4. Non-trivial algorithm + at least one provable statement', 'Battery-aware greedy and rolling-horizon ILP; Theorem 2 (single-round guarantees), Proposition 3 (myopic gap), Lemma 4 (battery price), Lemma 5 (upper bound)'],
  ['5. Experiments: synthetic data, ≥ 2 baselines, ILP gap on small instances', 'Random and Fastest-first baselines plus myopic greedy; E1–E7; ILP gaps in Table II'],
  ['6. Paper: intro, related work, model, algorithm, analysis, experiments, conclusion (6–8 pages)', '`PS7_Research_Paper.docx`, 6 pages, two-column'],
  ['Plan step 3: single-round ILP + greedy, verify ratio empirically', 'E1 (Table I of the paper)'],
  ['Plan step 4: multi-round ILP for R≈5–10, |K|≤30', 'E2 (K up to 30, R up to 10)'],
  ['Plan step 5: baselines random / fastest-first / myopic', '`flsel/policies.py`'],
  ['Plan step 6: battery-aware price, tune γ', 'E4, Fig. 2 of the paper'],
  ['Plan step 7: prove single-round ratio, adversarial example, ILP gap', 'Theorem 2, Proposition 3 + E5, Table II'],
  ['Plan step 8 (optional): FL simulation, coverage vs accuracy', 'E7 (digits data instead of MNIST)'],
  ['Guidelines: report coverage, full-coverage rounds, exhausted clients, Jain index', 'All four are in Table III and in the CSV files'],
  ['Guideline: do not do the neural part before the optimisation part works', 'E7 was run last, after E0–E6'],
], [4200, 4826], { size: 19, leftCols: [1] }));
ch.push(sp());

ch.push(h1('3. The model, explained'));
ch.push(table([
  ['Symbol', 'Meaning in words'],
  ['K, G, R', 'Number of clients, data groups and rounds'],
  ['h_kg ∈ {0,1}', '1 if client k holds data of group g'],
  ['w_g', 'Importance (weight) of group g'],
  ['τ_k, T_max', 'Time client k needs; the round deadline. If τ_k > T_max the client can never participate'],
  ['e_k', 'Energy client k spends each time it participates'],
  ['E_t, m', 'Energy budget of round t; maximum number of clients per round'],
  ['b⁰_k, β_k, ρ_kt', 'Initial battery, battery capacity, recharge after round t'],
  ['ϱ', 'Minimum participation fraction for fairness (0 = off)'],
  ['x_kt', 'Decision: 1 if client k is chosen in round t'],
  ['z_gt', 'Group g is covered in round t (≤ sum of x of clients holding g)'],
  ['b_kt, ω_kt', 'Battery at start of round t; overflow (energy that would exceed capacity and is lost)'],
], [2500, 6526], { size: 20, leftCols: [1] }));
ch.push(sp());
ch.push(p('**Why the overflow variable?** The true battery rule is *next = min(capacity, current − e·x + recharge)*. The “min” is not linear. We replace it by *next = current − e·x + recharge − ω* with *next ≤ capacity* and *ω ≥ 0*. Because having more battery never hurts, the solver never wastes energy on purpose, so both versions have the same optimum. This is the “exact” model the PS asked for.'));
ch.push(p('**Why can z be continuous?** If x is 0/1, each z_gt wants to be as large as allowed, which is 0 or 1 automatically. Making z continuous removes binary variables and speeds up the solver without changing the answer.'));
ch.push(h2('Assumptions we stated'));
ch.push(b('The deadline only decides who is *eligible* (τ_k ≤ T_max); times do not change from round to round.'));
ch.push(b('Energy per participation is constant; recharge arrives after the round; battery is capped.'));
ch.push(b('The ILP knows future recharge; the greedy policies use only the current battery (so they also work when future recharge is unknown – variant (iii) of the PS).'));
ch.push(b('Coverage is yes/no: holding any data of a group represents it. (The probabilistic variant (ii) is future work.)'));
ch.push(b('Fairness applies only to clients that meet the deadline.'));

ch.push(h1('4. The full pipeline, phase by phase'));
const phases = [
  ['Phase 1 – Understand and survey', 'Read the five base references (Section 7 of this guide explains each). Key takeaways: FedAvg is the FL setting; FedCS selects clients under a deadline; the single-round problem is budgeted maximum coverage; greedy gives (1−1/e) for submodular maximisation.'],
  ['Phase 2 – Model', 'Wrote the ILP exactly as in the PS and re-derived every constraint (Section 3). Implemented it in `flsel/ilp.py`.'],
  ['Phase 3 – Hardness', 'Reduced Set Cover to the single-round problem (Theorem 1) and verified the reduction by computer on 632 tiny cases (E0).'],
  ['Phase 4 – Baselines and tools', 'Instance generator, independent feasibility checker, exact ILPs, random and fastest-first baselines, round simulator.'],
  ['Phase 5 – Proposed methods', 'Battery-aware greedy (price e·(1+γ·depletion)) and a rolling-horizon ILP as a stronger look-ahead countermeasure.'],
  ['Phase 6 – Evaluation', 'Seven experiments over several sizes and seeds with means, standard deviations, worst cases and paired significance tests.'],
  ['Phase 7 – Write-up', 'Paper built from `results/numbers.json`, so every number in the paper is produced by the code, not typed by hand.'],
];
for (const [a, c] of phases) { ch.push(h2(a)); ch.push(p(c)); }

ch.push(h1('5. The algorithms in simple terms'));
ch.push(h2('5.1 Greedy for one round'));
ch.push(p('Start with an empty team. Repeatedly add the client that gives the **most new weight per unit of energy**, as long as it fits the budget and the limit *m*. Finally compare this team with the best *single* client and keep the better one. The single-client check is essential: with a client of cost 1 / value 1 and another of cost L / value L−1 and budget L, pure ratio-greedy takes the cheap one first and then cannot afford the big one (value 1 instead of L−1). The script `run_e1_single_round.py` prints exactly this example.'));
ch.push(h2('5.2 Why the guarantees hold (intuition)'));
ch.push(p('Coverage has *diminishing returns*: adding a client to a small team helps at least as much as adding it to a big team (submodularity). Greedy always takes the best step available, so after each step it has closed at least a fixed share of the remaining gap to the optimum. Compounding these shares gives 1−1/e ≈ 0.632. With a knapsack budget, greedy might stop one item too early; that last item is covered by the “best single client” check, which costs a factor ½, giving ½(1−1/e) ≈ 0.316. Trying all starting teams of three clients (*partial enumeration*) removes the ½ and gives the optimal 1−1/e [Khuller et al., Sviridenko]. In practice the ratios are far better: ' + `partial enumeration was optimal in all 300 tests and plain modified greedy never went below ${f2(e1m.modified_greedy.min)}.` + ' Important honesty point: these proofs are for *one* budget constraint; our round has a budget *and* a client cap, so for that case we only measured ratios.'));
ch.push(h2('5.3 Why the myopic (round-by-round) greedy can fail'));
ch.push(p('Greedy in round 1 uses the strongest client A because it is best *now*, although A can only be used once and will be needed in round 2 when the budget is smaller. Example (Proposition 3): A covers all n groups, B covers n−1 but costs 2, the round-2 budget is only 1. Greedy takes A, then has nothing good left in round 2 and earns n+1; the optimum takes B first and A later and earns 2n−1. The ratio (n+1)/(2n−1) tends to ½. The code (`run_e5_adversarial.py`) confirms this exactly for n = 5 … 1000.'));
ch.push(h2('5.4 The battery-aware greedy (our main heuristic)'));
ch.push(p('Same greedy, but the *price* of a client is its energy times (1 + γ × depletion), where depletion = 1 − battery/capacity (0 = full, 1 = empty). Drained clients look expensive so the greedy rests them; clients with full batteries look cheap, which is sensible because their recharge would overflow and be wasted anyway (Lemma 4). Feasibility always uses the *true* energy, so the price never causes an infeasible schedule. With γ = 0 it is the myopic greedy. Cost: O(R·m·K·G), about 10 ms for a whole 30-round run.'));
ch.push(h2('5.5 Rolling-horizon ILP'));
ch.push(p('In each round solve the exact ILP for the next W = 3 rounds (assuming known recharge and budgets), carry out only the first round’s decision, then repeat. It needs seconds per decision but is very close to optimal and it solves the adversarial example exactly. It is the “countermeasure” for the case where battery price is not enough.'));
ch.push(h2('5.6 Upper bound for large instances'));
ch.push(p('When the full ILP is too slow, we solve each round’s coverage problem *ignoring batteries* and add the values. Removing constraints can only increase the optimum, so this sum is a valid upper bound (Lemma 5). “% of UB” in the tables means coverage divided by this bound; 100% would be perfect and is an overestimate of what is achievable.'));

ch.push(h1('6. Hardness proof in simple words'));
ch.push(p('**Set Cover**: given a universe of elements and a collection of sets, can we pick at most k sets covering every element? It is a classic NP-complete problem. Build a client-selection instance: one *group* per element, one *client* per set (holding exactly the groups of that set), every client costs 1, the budget and the limit *m* are both k, one round, plenty of battery. Then “k clients cover all groups” is the same sentence as “k sets cover the universe”. So if we could solve client selection fast, we could solve Set Cover fast. Hence client selection is NP-hard, even for one round. Because all numbers are tiny (0, 1, k) it is *strongly* NP-hard. We also quote Feige’s theorem: with unit costs the problem is Maximum k-Coverage and nobody can beat the factor 1−1/e in polynomial time unless P = NP, so greedy’s 1−1/e is the best possible.'));
ch.push(p(`**Computer check (E0).** We generated random Set Cover instances, found the true minimum cover by brute force, built the client-selection instance for every k, and solved it with the ILP: the ILP reached full coverage exactly when k ≥ minimum cover, in ${N.e0.agree} of ${N.e0.total} cases.`));

ch.push(h1('7. Every reference explained'));
ch.push(box('**Note:** the summaries below come from my knowledge of these works, except that I checked online that the FedCS paper (Nishio & Yonetani) selects the largest number of clients able to finish download, update and upload within a deadline. Please read at least the abstract and introduction of each base paper yourself before the viva; I did not have the full texts available in this session.'));
ch.push(sp());
const refs = [
  ['[1] McMahan, Moore, Ramage, Hampson, Agüera y Arcas – “Communication-efficient learning of deep networks from decentralized data”, AISTATS 2017', 'The paper that introduced *federated averaging* (FedAvg): clients train locally for a few epochs and the server averages the model updates, weighted by data size. It also introduced the practice of sampling a subset of clients each round. **Use in our project:** it defines the FL setting (server, rounds, clients) and our E7 experiment is a small FedAvg run.'],
  ['[2] Nishio & Yonetani – “Client selection for federated learning with heterogeneous resources in mobile edge”, IEEE ICC 2019 (base paper)', 'Proposes *FedCS*: because phones have different compute and network resources, random selection wastes time; the server asks clients for resource information and selects as many clients as can finish within the round deadline. Its objective is the *number* of clients. **Use:** motivates our deadline and energy budget; **difference:** we maximise weighted coverage of data groups and model batteries over many rounds.'],
  ['[3] Khuller, Moss, Naor – “The budgeted maximum coverage problem”, Information Processing Letters 70(1), 1999 (base paper)', 'Defines budgeted maximum coverage (sets with costs, choose within a budget, maximise covered element weight), shows greedy + best single set gives ½(1−1/e), and greedy with partial enumeration of three sets gives (1−1/e), which is optimal. **Use:** the core of our single-round algorithm and Theorem 2.'],
  ['[4] Nemhauser, Wolsey, Fisher – “An analysis of approximations for maximizing submodular set functions—I”, Mathematical Programming 14, 1978', 'The classic result: for monotone submodular functions with a cardinality constraint, greedy is a (1−1/e)-approximation. **Use:** explains why coverage is greedy-friendly and gives Theorem 2(c).'],
  ['[5] Sviridenko – “A note on maximizing a submodular set function subject to a knapsack constraint”, Operations Research Letters 32, 2004', 'Extends the (1−1/e) guarantee to *any* monotone submodular function under a knapsack (cost) constraint, via partial enumeration plus greedy. **Use:** supports the partial-enumeration guarantee for general submodular rounds, e.g. the probabilistic-coverage variant.'],
  ['Added: [6] Karp 1972; [7] Garey & Johnson 1979', 'Karp’s paper establishes Set Cover as NP-complete; Garey & Johnson is the standard book of NP-completeness. **Use:** the source problem and framework for Theorem 1.'],
  ['Added: [8] Feige – “A threshold of ln n for approximating set cover”, J. ACM 1998', 'Shows that Set Cover and Maximum k-Coverage cannot be approximated better than the greedy factors unless P = NP; for max k-coverage the barrier is 1−1/e. **Use:** Corollary 1.'],
  ['Added: [9] Jain, Chiu, Hawe 1984', 'Defines *Jain’s fairness index* (Σx)²/(n·Σx²), equal to 1 when everyone participates equally. **Use:** fairness metric for participation counts.'],
  ['Added: [10] HiGHS (Huangfu & Hall 2018), [11] SciPy (Virtanen et al. 2020), [12] scikit-learn (Pedregosa et al. 2011)', 'The open-source solver, the numerical library that exposes it as `scipy.optimize.milp`, and the library providing the digits data set.'],
];
ch.push(table([['Reference', 'What it is and how we used it'], ...refs], [3200, 5826], { size: 19, leftCols: [1] }));
ch.push(sp());

ch.push(h1('8. The experiments and what the numbers mean'));
ch.push(h2('E0 and E1 – correctness and single-round quality'));
ch.push(p(`The ILP agreed with brute force on all ${N.e1_val.n_val} tiny instances. On ${N.e1_lp.n} random single-round instances per setting: partial enumeration reached the optimum every time; modified greedy averaged ${f3(e1k.modified_greedy.mean)} (knapsack only) and ${f3(e1m.modified_greedy.mean)} (with the client cap) of the optimum, worst case ${f2(e1m.modified_greedy.min)}; plain cardinality greedy (ignoring energy) averaged ${f3(e1k['plain_greedy(NWF)'].mean)} with worst case ${f2(e1k['plain_greedy(NWF)'].min)}. The LP relaxation was on average ${f1(100 * (N.e1_lp.mean - 1))}% above the optimum.`));
ch.push(...pic('fig_single.png', 320, 207, 'Ratio of each greedy variant to the exact optimum (boxplots; green triangle = mean).'));
ch.push(h2('E2 – small multi-round instances against the exact ILP'));
ch.push(p(`With 15–30 clients and 5–10 rounds we solved the full ILP (30 s limit). Average gap of each policy to the ILP: Random ${f1(e2[15].gaps.random.mean)}/${f1(e2[20].gaps.random.mean)}/${f1(e2[30].gaps.random.mean)}%, Fastest ${f1(e2[15].gaps.fastest.mean)}/${f1(e2[20].gaps.fastest.mean)}/${f1(e2[30].gaps.fastest.mean)}%, Myopic ${f1(e2[15].gaps.myopic.mean)}/${f1(e2[20].gaps.myopic.mean)}/${f1(e2[30].gaps.myopic.mean)}%, Battery-aware ${f1(e2[15].gaps.battery_aware.mean)}/${f1(e2[20].gaps.battery_aware.mean)}/${f1(e2[30].gaps.battery_aware.mean)}%, Rolling ILP ${f1(e2[15].gaps.rolling_ilp.mean)}/${f1(e2[20].gaps.rolling_ilp.mean)}/${f1(e2[30].gaps.rolling_ilp.mean)}% (for K = 15/20/30). For K = 30 only ${e2[30].optimal} of ${e2[30].n} instances were solved to proven optimality within the limit; the remaining gaps are relative to the best solution found (proven bound gap at most ${f1(e2[30].max_bound_gap)}%). The extra cuts we added to “strengthen” the ILP did not speed it up (${f1(e2[30].t_strong)} s vs ${f1(e2[30].t_plain)} s); we report this negative result instead of hiding it.`));
ch.push(h2('E3 – large instances'));
ch.push(p(`With 100 clients, 30 groups and 30 rounds the exact ILP is out of reach, so we compare with the upper bound. Random reaches ${f1(A.random.pct_ub)}% of it, Fastest ${f1(A.fastest.pct_ub)}%, Myopic ${f1(A.myopic.pct_ub)}%, Battery-aware ${f1(A.battery_aware.pct_ub)}%. Battery-aware beats Myopic by ${f1(p3.K100_G30_R30.mean_gain)}% on average, in ${p3.K100_G30_R30.wins} of ${p3.K100_G30_R30.n} instances (Wilcoxon p < 0.001), and the number of exhausted clients drops from ${f1(A.myopic.exhausted_clients)} to ${f1(A.battery_aware.exhausted_clients)}. In the 12-group setting full-coverage rounds rise from ${f2(Bc.myopic.full_rounds)} to ${f2(Bc.battery_aware.full_rounds)}. Rolling ILP was run on only 5 seeds because each run takes about ${Math.round(A.rolling_ilp.time)} s.`));
ch.push(...pic('fig_compare.png', 600, 216, 'Left: gap to the exact ILP. Right: coverage as % of the upper bound.'));
ch.push(h2('E4 – tuning γ and energy scarcity'));
ch.push(p(`Larger γ spreads participation more (fewer exhausted clients, higher Jain index) but eventually costs coverage when G is small: for the 12-group setting coverage peaks near γ ≈ 0.5–1 (${f1(g4.K40_G12_R15['1.0'].cov_pct)}%) and falls to ${f1(g4.K40_G12_R15['8.0'].cov_pct)}% at γ = 8. We recommend γ between 1 and 2. The benefit of battery awareness is largest under moderate scarcity and disappears when energy is either extremely scarce or abundant (Table IV of the paper).`));
ch.push(...pic('fig_gamma.png', 600, 175, 'Effect of γ on coverage, Jain fairness index and number of exhausted clients.'));
ch.push(h2('E5 – the adversarial family'));
ch.push(p('The myopic greedy and the battery-aware greedy both earn exactly (n+1)/(2n−1) of the optimum; the rolling-horizon ILP with W = 2 is optimal. This shows honestly that a battery price alone is *not* a universal fix; look-ahead is needed for budget-driven traps.'));
ch.push(...pic('fig_adv_scarcity.png', 600, 198, 'Left: ALG/OPT on the adversarial family. Right: coverage vs recharge scale.'));
ch.push(h2('E6 – fairness (minimum participation)'));
ch.push(p(`Solving the ILP with the fairness constraint on 20 clients: requiring participation fractions up to 0.2 costs nothing; 0.3 costs ${f2(N.e6['0.3'].loss)}%; 0.4 is feasible for only ${N.e6['0.4'].feas} of ${N.e6['0.4'].n} instances; 0.5 is infeasible in every instance (batteries cannot sustain it).`));
ch.push(h2('E7 – does coverage really help learning?'));
ch.push(p(`We ran FedAvg with softmax regression on a non-IID split of the scikit-learn digits data (10 classes = 10 groups; each client holds only 2–4 classes). Over ${N.e7.n} runs the per-round coverage and the final test accuracy have Pearson correlation ${f2(N.e7.pearson)} (Spearman ${f2(N.e7.spearman)}). Coverage-driven policies reach ${f1(N.e7_alg.myopic.acc)}–${f1(N.e7_alg.battery_aware.acc)}% accuracy versus ${f1(N.e7_alg.random.acc)}% (Random) and ${f1(N.e7_alg.fastest.acc)}% (Fastest). The accuracy difference between Myopic and Battery-aware is too small to claim.`));
ch.push(...pic('fig_fl.png', 330, 233, 'Coverage vs final accuracy; each dot is one run.'));

ch.push(h1('9. How to run everything'));
ch.push(b('Unzip `PS7_code_and_results.zip`, open a terminal in `fl_project`, run `pip install -r requirements.txt`.'));
ch.push(b('Run `sh run_all.sh` for all experiments (about 25–30 minutes on one core), or run one script, e.g. `python3 run_e5_adversarial.py` (instant) or `python3 run_e1_single_round.py` (15 s).'));
ch.push(b('Results appear in `results/*.csv` and `results/numbers.json`; figures in `figures/`.'));
ch.push(b('To rebuild the Word files you need Node and the `docx` package: `node docs/paper.js`. The paper reads `results/numbers.json`, so re-running the experiments updates the numbers automatically.'));
ch.push(b('Small changes in solver version or machine speed can change which K = 30 instances finish within the 30 s limit, so the K = 30 row of Table II may shift slightly when you re-run.'));

ch.push(h1('10. Honesty notes – read before submitting'));
ch.push(b('**Author names** in the paper are placeholders.'));
ch.push(b('**Theorem 2** is proved for one budget constraint; our round has budget *and* cap, so for that setting the ratios are empirical only. The partial-enumeration part is a sketch that defers algebra to the cited papers; if your professor wants the full algebra, take it from Khuller et al. [3].'));
ch.push(b('**Synthetic data.** The generator was chosen to create an energy-constrained regime; we show (Table IV) that gains shrink outside it. Do not claim the battery-aware greedy always wins: on small instances it is statistically indistinguishable from myopic.'));
ch.push(b('**MNIST was not used** (no internet in the sandbox); we used scikit-learn’s 8×8 digits. If you can download MNIST, you can swap it into `flsel/fedavg.py`.'));
ch.push(b('**Page count** (6 pages) was checked by converting to PDF with LibreOffice; Word may paginate slightly differently. Open the file in Word and confirm it is 6–8 pages.'));
ch.push(b('**Reference summaries** (Section 7) are from my knowledge except the FedCS objective, which I verified online. Check against the originals.'));
ch.push(b('Variants (ii) probabilistic coverage and (iii) online unknown recharge are **not** implemented as separate experiments; the greedy policies simply never use future recharge.'));

ch.push(h1('11. Likely viva questions with short answers'));
const qa = [
  ['Why is the problem NP-hard?', 'Set Cover reduces to it already for one round (clients = sets, groups = elements, unit costs, budget k). We verified this on 632 small cases.'],
  ['Why is coverage submodular?', 'Adding a client to a larger team can only cover fewer *new* groups than adding it to a smaller team: diminishing returns. It is also monotone (more clients never reduce coverage).'],
  ['What guarantee does your single-round algorithm have?', '½(1−1/e) for modified greedy and (1−1/e) with partial enumeration, for one knapsack constraint. With the extra client cap we measured ratios ≥ 0.85, and enumeration was optimal in all tests.'],
  ['Why is 1−1/e optimal?', 'Feige showed no polynomial algorithm beats 1−1/e for Maximum k-Coverage unless P = NP.'],
  ['Why does myopic greedy fail?', 'It spends a client that is scarce in the future. Our family gives ratio (n+1)/(2n−1) → ½.'],
  ['Does your battery price fix that?', 'No – on that family both clients look equally full, so the price cannot separate them. Rolling-horizon ILP fixes it because it looks ahead.'],
  ['Why is the overflow variable needed?', 'It linearises min(capacity, …) exactly; larger batteries never hurt, so wasting energy on purpose is never optimal.'],
  ['How do you know your ILP is correct?', 'It matched brute force on 60 tiny instances and the Set Cover check, and every schedule passes an independent checker.'],
  ['Why compare to an “upper bound” on big instances?', 'The full ILP cannot be solved; ignoring batteries gives a valid upper bound, so “% of UB” is a conservative measure.'],
  ['What is Jain’s index?', '(Σx)²/(n·Σx²) over participation counts; 1 = perfectly even, 1/n = one client does everything.'],
  ['What did not work?', 'The added ILP cuts gave no speed-up; battery pricing gives only ~1–2% more coverage; at tiny sizes it is not better than myopic.'],
  ['What would you do next?', 'Guarantees for knapsack+cardinality rounds, probabilistic coverage, unknown-recharge competitive analysis, real MNIST/CIFAR training.'],
];
ch.push(table([['Question', 'Answer'], ...qa], [3000, 6026], { size: 20, leftCols: [1] }));

const doc = new Document({
  styles: { default: { document: { run: C } },
    paragraphStyles: [{ id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Calibri' }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Calibri' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } }] },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1247, bottom: 1247, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT], size: 18, font: 'Calibri' })] })] }) },
    children: ch }],
});
Packer.toBuffer(doc).then(bf => { fs.writeFileSync('/mnt/user-data/outputs/PS7_Project_Guide.docx', bf); console.log('ok'); });
