const { D, parse, img, table } = require('./lib.js');
const { Document, Packer, Paragraph, TextRun, AlignmentType, SectionType, Footer, PageNumber, TabStopType, Tab, BorderStyle } = D;
const fs = require('fs');
const N = JSON.parse(fs.readFileSync('../results/numbers.json'));
const F = '../figures/';
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), f3 = x => x.toFixed(3);
const FONT = 'Times New Roman', SZ = 20;           // 10 pt body
const CW = 4693;                                    // one column width (DXA, A4, 0.75in margins, 0.25in gap)
const B = { font: FONT, size: SZ };

const body = t => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 70, line: 250 }, children: parse(t, B) });
const sec = t => new Paragraph({ spacing: { before: 130, after: 60 }, keepNext: true, children: [new TextRun({ text: t.toUpperCase(), font: FONT, size: 18, bold: true })], alignment: AlignmentType.CENTER });
const sub = t => new Paragraph({ spacing: { before: 80, after: 40 }, keepNext: true, children: parse(t, { ...B, italics: true, bold: true }) });
const cap = t => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 30, after: 100 }, children: parse(t, { font: FONT, size: 16 }) });
const capT = t => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 90, after: 40 }, keepNext: true, children: parse(t, { font: FONT, size: 16 }) });
const eq = (t, n) => new Paragraph({ spacing: { before: 20, after: 20 }, tabStops: [{ type: TabStopType.CENTER, position: CW / 2 }, { type: TabStopType.RIGHT, position: CW }],
  children: [new TextRun({ children: [new Tab()] }), ...parse(t, B), new TextRun({ ...B, children: [new Tab(), n ? `(${n})` : ''] })] });
const fig = (p, w, h, c) => [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 20 }, keepNext: true, children: [img(F + p, w, h)] }), cap(c)];
const bullet = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { after: 40, line: 250 }, children: parse(t, B) });
const code = lines => table([[lines]], [CW], { noHeader: true, size: 15, font: 'Courier New', plain: false, rowFill: () => 'F5F5F5' });
const sp = () => new Paragraph({ spacing: { after: 60 }, children: [] });

// ------------------------------------------------------------------ title block (single column)
const e1k = N.e1.knapsack_only, e1m = N.e1.with_cardinality_m5;
const e2 = N.e2, e3 = N.e3, p3 = N.e3_paired, g4 = N.e4;
const A = e3.K100_G30_R30, Bc = e3.K60_G12_R20;
const rAdv = N.e5[N.e5.length - 1];

const title = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'Energy-Aware Client Selection in Federated Learning as Multi-Round Budgeted Maximum Coverage: Hardness, Exact Models and Battery-Aware Greedy Algorithms', font: FONT, size: 34, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: [new TextRun({ text: '[Student Name 1], [Student Name 2], [Student Name 3], [Student Name 4], [Student Name 5]', font: FONT, size: 21 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 30 }, children: [new TextRun({ text: 'Department of Computer Science and Engineering, Rajiv Gandhi Institute of Petroleum Technology (RGIPT)', font: FONT, size: 18, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Advanced Algorithms Project, Problem Statement PS–7, Academic Year 2026–27', font: FONT, size: 18, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 60, line: 250 }, indent: { left: 360, right: 360 },
    children: parse(`**Abstract—**In federated learning (FL) a server repeatedly selects devices that hold data of different groups (e.g., label classes), while the devices differ in speed and battery and every round has a deadline and an energy budget. We formalise multi-round client selection as maximising total weighted group coverage over *R* rounds subject to deadline, per-round energy and cardinality budgets, and battery dynamics with recharge and overflow. We prove NP-hardness by reduction from Set Cover (already for one round with unit costs), give an exact ILP, and show that single-round greedy with partial enumeration attains the optimal (1−1/*e*) factor for the knapsack-constrained case. We then show that the myopic round-wise greedy can lose a factor approaching 2 on an adversarial family, and propose a battery-aware greedy with price *e*_{k}(1+γ·depletion_{k}) and a rolling-horizon ILP. On small instances solved exactly, the myopic greedy is ${f1(e2[15].gaps.myopic.mean)}–${f1(e2[20].gaps.myopic.mean)}% below the optimum and the rolling-horizon ILP ${f1(e2[30].gaps.rolling_ilp.mean)}–${f1(e2[20].gaps.rolling_ilp.mean)}%. On large instances the battery-aware greedy raises coverage by ${f1(p3.K100_G30_R30.mean_gain)}% (paired Wilcoxon *p*<0.001) and cuts the number of exhausted clients by ${Math.round(100 * (1 - A.battery_aware.exhausted_clients / A.myopic.exhausted_clients))}%; coverage correlates with FedAvg accuracy (Pearson *r*=${f2(N.e7.pearson)}).`, { font: FONT, size: 18 }) }),
  new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 }, indent: { left: 360, right: 360 },
    children: parse('**Index Terms—**federated learning, client selection, submodular maximisation, budgeted maximum coverage, integer programming, battery-aware scheduling.', { font: FONT, size: 18, italics: true }) }),
];

// ------------------------------------------------------------------ main text (two columns)
const main = [];
main.push(sec('I. Introduction'));
main.push(body('Federated learning (FL) [1] trains a shared model on data that stay on users’ devices. In every round the server sends the current model to a subset of clients, collects their updates and aggregates them. *Which* clients take part matters: devices differ in speed and battery, rounds have a deadline, and the data held by the chosen clients decide how representative the update is. Always choosing fast, data-rich devices drains their batteries and biases the model [2]; choosing at random wastes rounds.'));
main.push(body('We study this as a combinatorial optimisation problem. Each client holds data of a few *groups* (label classes or user segments); the value of a round is the total weight of groups represented by at least one selected client, a monotone submodular coverage function. A round is limited by a deadline, an energy budget and a client cap, and every client owns a battery that participation drains and a known recharge refills. The goal is to maximise coverage over *R* rounds. Our contributions are:'));
main.push(bullet('**Model and exact ILP** with an exact overflow-slack linearisation of the battery dynamics, an independent solution checker, and a fairness extension (Section III).'));
main.push(bullet('**NP-hardness** by reduction from Set Cover, valid already for one round with unit costs, machine-verified on 632 tiny cases, and the resulting (1−1/*e*) inapproximability (Section IV).'));
main.push(bullet('**Single-round guarantees**: modified greedy (½(1−1/*e*)) and partial enumeration (1−1/*e*) for the knapsack case, with measured ratios on 300 instances (Section V-A, VII-A).'));
main.push(bullet(`**Why myopic fails**: an adversarial family on which round-wise greedy achieves exactly (*n*+1)/(2*n*−1) → ½ of the optimum, which a battery price cannot repair, but a rolling-horizon ILP can (Section V-B).`));
main.push(bullet('**Battery-aware greedy** with price *e*_{k}(1+γ·depletion_{k}) and its evaluation against the ILP, an upper bound, and baselines, including a FedAvg experiment (Sections V-C, VII).'));

main.push(sec('II. Related Work'));
main.push(body('FedAvg [1] introduced communication-efficient FL with random client sampling. FedCS [2] observed that heterogeneous resources make random sampling inefficient and selects the largest number of clients that can finish download, update and upload within a deadline. Its objective counts clients; ours maximises weighted *data coverage* and adds battery dynamics across rounds. A single deadline-constrained round is a budgeted maximum coverage problem: Khuller, Moss and Naor [3] give a (1−1/*e*)-approximation by greedy with partial enumeration, building on the analysis of submodular maximisation by Nemhauser, Wolsey and Fisher [4] and on Sviridenko’s knapsack-constrained algorithm [5]. These guarantees are per round; with batteries, rounds are coupled and per-round optimality does not compose, which is the gap we study.'));

main.push(sec('III. Problem Formalisation'));
main.push(sub('A. Notation and model'));
main.push(body('Let *K* be the clients, *G* the data groups and rounds *t*=1,…,*R*. Client *k* holds group *g* iff *h*_{kg}=1; group *g* has weight *w*_{g}. Client *k* needs time τ_{k} and energy *e*_{k} per participation, has initial battery *b*^{0}_{k}, capacity β_{k} and recharge ρ_{kt}≥0 in round *t*. A round has deadline *T*_{max}, energy budget *E*_{t} and may use at most *m* clients; ϱ∈[0,1] is a minimum participation fraction (ϱ=0 disables fairness). Variables: *x*_{kt}∈{0,1} (selected), *z*_{gt} (group covered), *b*_{kt} (battery at the start of round *t*) and overflow ω_{kt}≥0.'));
main.push(eq('max ∑_{t=1}^{R} ∑_{g∈G} *w*_{g} *z*_{gt}', 1));
main.push(eq('*z*_{gt} ≤ ∑_{k} *h*_{kg} *x*_{kt}  ∀*g*,*t*;   *x*_{kt}=0 if τ_{k}>*T*_{max}', 2));
main.push(eq('∑_{k} *x*_{kt} ≤ *m*,   ∑_{k} *e*_{k} *x*_{kt} ≤ *E*_{t}   ∀*t*', 3));
main.push(eq('*e*_{k} *x*_{kt} ≤ *b*_{kt}   ∀*k*,*t*', 4));
main.push(eq('*b*_{k,t+1} = *b*_{kt} − *e*_{k}*x*_{kt} + ρ_{kt} − ω_{kt},  *b*_{k,t+1} ≤ β_{k}', 5));
main.push(eq('*b*_{k1}=*b*^{0}_{k},   ∑_{t} *x*_{kt} ≥ ⌊ϱ*R*⌋ (eligible *k*)', 6));
main.push(eq('*x*_{kt}∈{0,1}, *z*_{gt}∈[0,1], *b*_{kt}, ω_{kt} ≥ 0', 7));
main.push(body('**Assumptions.** (A1) Deadline is a per-client eligibility test, τ_{k} ≤ *T*_{max}. (A2) *e*_{k} is constant; recharge is applied after the round and the battery is capped at β_{k}. (A3) Recharge is known to the ILP; the greedy policies use only the current battery, hence are also valid when future recharge is unknown. (A4) Coverage is binary: holding any data of a group represents it. (A5) Holdings *h*_{kg} and weights are time-invariant. (A6) Fairness (6) applies only to deadline-eligible clients.'));
main.push(body('**Exactness of (5).** The original rule *b*_{k,t+1}=min{β_{k}, *b*_{kt}−*e*_{k}*x*_{kt}+ρ_{kt}} is equivalent to (5): a larger battery only relaxes (4) and (5) in later rounds, so discarding energy beyond overflow never helps and the optima coincide. Since *x* is binary, *z* is integral at an optimum, so *z* can be continuous, which speeds up the solver. We also tried presolve fixing (*x*_{kt}=0 if *e*_{k}>*E*_{t}) and valid cumulative-energy cuts ∑_{s≤t} *e*_{k}*x*_{ks} ≤ *b*^{0}_{k}+∑_{s<t}ρ_{ks}; they gave no speed-up with HiGHS (Section VII-B).'));

main.push(sec('IV. Complexity'));
main.push(body('**Theorem 1.** The decision problem “is there a selection with total coverage ≥ *V*?” is NP-hard in the strong sense, even for *R*=1, unit weights, unit energies, no batteries and no fairness.'));
main.push(body('*Proof.* Membership in NP is clear (check constraints and coverage in polynomial time) [7]. Hardness: reduce from Set Cover [6]: universe *U*={*u*_{1},…,*u*_{n}}, sets *S*_{1},…,*S*_{p}, integer *k*. Create one group per element (*w*=1) and one client per set with *h*_{jg}=1 iff *u*_{g}∈*S*_{j}; set *e*_{j}=1, τ_{j}=0, *T*_{max}=1, *m*=*E*_{1}=*k*, *R*=1, and β_{j}=*b*^{0}_{j}=1, ρ=0. A selection of at most *k* clients covers all *n* groups iff *k* sets cover *U*; take *V*=*n*. The construction is polynomial and all numbers are in {0,1,*k*}, hence strong NP-hardness. ∎'));
main.push(body(`*Verification.* We generated random Set Cover instances (|*U*|=8, 8 sets), computed the minimum cover size by brute force and solved the constructed ILP for every *k*: the two answers agreed on ${N.e0.agree}/${N.e0.total} (instance, *k*) pairs.`));
main.push(body('**Corollary 1.** With unit costs and *R*=1 the problem is Maximum *k*-Coverage, so by Feige [8] no polynomial algorithm guarantees (1−1/*e*+ε) unless P=NP. Hence the (1−1/*e*) of Section V-A is optimal. If batteries are unlimited the rounds decouple into *R* independent budgeted coverage problems; batteries create the coupling that defeats per-round optimality (Section V-B). The pseudo-polynomial knapsack DP does not help because coverage is not additive.'));

main.push(sec('V. Algorithms and Analysis'));
main.push(sub('A. Single round: greedy with partial enumeration'));
main.push(body('Fix a round with candidate set *A*, budget *E* and cap *m*. Let *f*(*S*) be the weight of groups covered by *S* (monotone, submodular) and Δ(*k*|*S*) the marginal gain. **ROUND-GREEDY** (Algorithm 1) repeatedly adds the affordable client with the largest Δ(*k*|*S*)/*c*_{k}, where *c*_{k} is a *price* (the true energy *e*_{k} by default); feasibility always uses *e*_{k}. The returned set is the better of the greedy set and the best single affordable client. **PARTIAL-ENUM(3)** tries every start set of at most three clients and completes each with ROUND-GREEDY.'));
main.push(code(['Alg. 1  ROUND-GREEDY(A, c, E, m)',
  '1  S <- {}',
  '2  while |S| < m:',
  '3    C <- {k in A\\S : e_k <= E - e(S)}',
  '4    k* <- argmax_{k in C} gain(k|S) / c_k',
  '5    if gain(k*|S) = 0: break',
  '6    S <- S + {k*}',
  '7  return better of S and best single client'].join('\n')));
main.push(sp());
main.push(body('**Theorem 2.** For the knapsack constraint only (*m*=∞) and prices *c*=*e*: (a) ROUND-GREEDY with the best-single fallback is a ½(1−1/*e*)-approximation; (b) PARTIAL-ENUM(3) is a (1−1/*e*)-approximation [3], [5]. For the cardinality constraint only (*c*≡1, *E*=∞) plain greedy is a (1−1/*e*)-approximation [4].'));
main.push(body('*Proof of (a).* Let *O* be an optimum with *e*(*O*)≤*E* and let *G*_{i} be the first *i* clients picked by the idealised greedy that ignores the budget, with costs *c*_{i}. Let *l*+1 be the first pick that does not fit, so *G*_{l} fits and ∑_{i≤l+1} *c*_{i}>*E*. By submodularity, *f*(*O*)−*f*(*G*_{i−1}) ≤ ∑_{o∈O\\G_{i−1}} Δ(*o*|*G*_{i−1}) ≤ (Δ_{i}/*c*_{i})·*E*, hence *f*(*G*_{i})−*f*(*G*_{i−1}) ≥ (*c*_{i}/*E*)(*f*(*O*)−*f*(*G*_{i−1})) and *f*(*G*_{l+1}) ≥ [1−∏_{i≤l+1}(1−*c*_{i}/*E*)] *f*(*O*) > (1−1/*e*) *f*(*O*), using ∑*c*_{i}>*E* and the AM–GM inequality. Because *f*(*G*_{l+1}) ≤ *f*(*G*_{l})+*f*({*g*_{l+1}}), one of *G*_{l} and the single client *g*_{l+1} (which fits alone) has value ≥ ½(1−1/*e*)*f*(*O*). Our implementation skips non-fitting clients and continues; by monotonicity its set is a superset of *G*_{l}, so the bound holds. ∎'));
main.push(body('*Proof sketch of (b).* Order the clients of *O* by the greedy rule *o*_{1},*o*_{2},… (each has the largest marginal gain among the remaining ones of *O*) and let the algorithm guess *o*_{1},*o*_{2},*o*_{3} as the start set *S*_{0}. The key lemma is that the first client *g*_{l+1} that the greedy completion cannot afford has marginal gain at most *f*(*S*_{0})/3, because it cannot exceed that of *o*_{3}. Running the chain of part (a) on the residual problem and charging the last, non-fitting client at most this small amount removes the factor ½ and yields (1−1/*e*); we refer to Khuller et al. [3] and Sviridenko [5] for the full algebra. Part (c) is the same chain with *c*_{i}/*E*=1/*m*, i.e. (1−1/*m*)^{m} ≤ 1/*e* [4]. The enumeration costs *O*(|*K*|^{3}) greedy runs per round, which is affordable for single rounds but not inside a 30-round simulation, so Algorithms 1–2 use the plain fallback version.'));
main.push(body('The proof does not cover *both* a knapsack *and* a cardinality constraint, which is our actual setting; we therefore measure ratios empirically (Section VII-A).'));

main.push(sub('B. Why the myopic greedy fails'));
main.push(body('**Proposition 3.** For every *n* there is a two-round instance on which the round-wise greedy earns exactly (*n*+1)/(2*n*−1) of the optimum, which tends to ½.'));
main.push(body('*Proof.* Unit weights, *m*=1, *E*=(2,1). Client A covers all *n* groups, *e*=1, battery for exactly one participation, ρ=0. Client B covers *n*−1 groups, *e*=2, battery for one participation. Client W covers one group, *e*=1, unlimited battery. In round 1 greedy takes A (best gain and best ratio *n* vs (*n*−1)/2). In round 2 B is unaffordable (2>1) and A is exhausted, so W is taken: total *n*+1. The optimum takes B in round 1 and A in round 2: 2*n*−1. ∎'));
main.push(body('A and B have identical depletion before round 1, so any price that depends on the battery level alone cannot separate them; fixing this requires knowing the future budget *E*_{2}.'));

main.push(sub('C. Battery-aware greedy'));
main.push(body('**BATTERY-AWARE** (Algorithm 2) runs ROUND-GREEDY in every round with price *c*_{k}=*e*_{k}(1+γ·depletion_{k}) and depletion_{k}=1−*b*_{kt}/β_{k}∈[0,1], where γ≥0 is tuned. A drained client is “expensive”, so the greedy spreads participation, but the budget test still uses the true *e*_{k}. γ=0 recovers the myopic greedy.'));
main.push(code(['Alg. 2  BATTERY-AWARE(gamma)',
  '1  b <- b0',
  '2  for t = 1..R:',
  '3    A <- {k : tau_k <= Tmax and b_k >= e_k}',
  '4    c_k <- e_k * (1 + gamma * (1 - b_k/beta_k))',
  '5    S_t <- ROUND-GREEDY(A, c, E_t, m)',
  '6    b_k <- min(beta_k, b_k - e_k*[k in S_t] + rho_kt)'].join('\n')));
main.push(sp());
main.push(body('**Lemma 4.** (i) Every schedule produced is feasible for (2)–(5). (ii) The running time is *O*(*R·m·|K|·|G|*). (iii) If *b*_{kt}=β_{k} and ρ_{kt}≥*e*_{k}, then participating leaves the next battery at β_{k}, i.e. it is free, and the price is the lowest possible (depletion 0).'));
main.push(body('*Proof.* (i) The candidate set enforces deadline and battery, ROUND-GREEDY enforces *E*_{t} and *m*, and batteries follow (5). (ii) Each of at most *m* iterations scores ≤|*K*| clients over |*G*| groups. (iii) min{β, β−*e*+ρ}=β iff ρ≥*e*. ∎'));
main.push(body('Lemma 4(iii) explains the price: clients near full capacity would waste recharge as overflow anyway, so using them is cheap; drained clients carry a real opportunity cost.'));

main.push(sub('D. Rolling-horizon ILP and an upper bound'));
main.push(body('**ROLLING-ILP(*W*)** solves the ILP (1)–(7) for rounds *t*,…,*t*+*W*−1 from the current batteries (recharge in the window assumed known) and commits only round *t*; *W*=1 is the per-round optimum and *W*=*R* is exact. **Lemma 5.** Let UB=∑_{t} OPT_{t}, where OPT_{t} is the optimum of round *t* ignoring batteries. Then UB ≥ OPT. *Proof:* dropping (4)–(5) relaxes the problem and decouples rounds. ∎ We use UB when the full ILP is too large.'));

main.push(sec('VI. Experimental Setup'));
main.push(body('**Instances.** Each client holds 2–4 random groups of *G*; weights are integers in 1..5; τ_{k} is log-normal(0, 0.5); *e*_{k}=10τ_{k}/mean(τ); *T*_{max} is the 70% quantile of τ; β_{k}=3*e*_{k}, *b*^{0}_{k}~U(0.5,1)β_{k}; recharge is *r*_{k}·*e*_{k}·U(0.5,1.5) with *r*_{k}~U(0.05,0.30), so a client can sustain about *r*_{k} participations per round; *E*_{t}=*m*·mean(*e*)·U(0.8,1.2) and *m*=max(3,⌊*G*/3⌋) unless stated. **Methods.** Random, Fastest-first, Myopic greedy (γ=0), Battery-aware (γ=1.5), Rolling ILP (*W*=3). **Metrics.** Coverage (also as % of *R*·∑*w*), fraction of rounds with every group covered, *exhausted clients* (eligible clients that at least once could not afford *e*_{k}), and Jain’s index [9] of participation counts of eligible clients. **Tooling.** Python 3, NumPy/SciPy [11], ILPs solved by HiGHS [10] through `scipy.optimize.milp`, one CPU core, fixed seeds. Every schedule is re-verified by an independent checker that recomputes batteries and objective from the 0/1 matrix.'));

const tp = [['Parameter','Value'],['Clients K / groups G / rounds R','40–100 / 12–30 / 5–30'],['Groups per client','2–4 (uniform)'],['Group weight w_g','integer in 1..5'],['Time τ_k','log-normal(0, 0.5)'],['Energy e_k','10·τ_k / mean(τ)'],['Deadline T_max','70% quantile of τ'],['Capacity β_k / initial b⁰_k','3·e_k / U(0.5,1)·β_k'],['Recharge ρ_kt','r_k·e_k·U(0.5,1.5), r_k~U(0.05,0.30)'],['Round budget E_t','m·mean(e)·U(0.8,1.2)'],['Clients per round m','max(3, ⌊G/3⌋) or as stated']];
main.push(capT('TABLE 0. Instance generator parameters.'));
main.push(table(tp, [2293, 2400], { size: 15, leftCols: [1] }));
main.push(sp());
main.push(sec('VII. Results'));
main.push(sub('A. ILP validation and single-round ratios'));
main.push(body(`The single-round ILP matched brute-force enumeration on all ${N.e1_val.n_val} tiny instances (${N.e1_val.ilp_bf_mismatch} mismatches). Table I gives the ratio to the ILP optimum on ${N.e1_lp.n} random instances per setting (*K*=26, *G*=15, budget = 25% of eligible energy). PARTIAL-ENUM(3) was optimal on every instance; ROUND-GREEDY with fallback never fell below ${f2(e1m.modified_greedy.min)}, far above the worst-case ½(1−1/*e*)≈0.316; plain cardinality greedy fell to ${f2(e1k['plain_greedy(NWF)'].min)}. Running times were ${f2(e1k.modified_greedy.time_ms)} ms (modified greedy) and ${f1(e1k.partial_enum3.time_ms)} ms (enumeration). The LP relaxation was on average ${f1(100 * (N.e1_lp.mean - 1))}% above the optimum (max ${f1(100 * (N.e1_lp.max - 1))}%). Ratio-greedy alone is not enough: on the instance {cost 1, value 1; cost *L*, value *L*−1}, budget *L*, it earns 1 while the optimum is *L*−1, which the best-single fallback repairs.`));
const t1 = [['Algorithm', 'Knapsack mean', 'min', '+cap. *m*=5 mean', 'min']];
for (const [k, nm] of [['plain_greedy(NWF)', 'Plain greedy'], ['ratio_greedy', 'Ratio greedy'], ['modified_greedy', 'Modified greedy'], ['partial_enum3', 'Partial enum. (3)']])
  t1.push([nm, f3(e1k[k].mean), f3(e1k[k].min), f3(e1m[k].mean), f3(e1m[k].min)]);
main.push(capT('TABLE I. Single-round value / ILP optimum (150 instances per setting).'));
main.push(table(t1, [1393, 800, 700, 1100, 700], { size: 15 }));
main.push(sp());
main.push(...fig('fig_single.png', 307, 199, 'Fig. 1a. Distribution of single-round ratios to the ILP optimum (both settings pooled); dashed line: 1−1/e.'));

main.push(sub('B. Small multi-round instances against the exact ILP'));
main.push(body(`Table II compares policies with the exact multi-round ILP on 8 seeds per size (30 s limit; every instance with *K*≤20 was solved to optimality, ${e2[30].optimal}/${e2[30].n} for *K*=30 with a proven bound gap of at most ${f1(e2[30].max_bound_gap)}%, so reported gaps are relative to the incumbent). Random and Fastest lose 18–27%. Myopic greedy loses ${f1(e2[15].gaps.myopic.mean)}–${f1(e2[20].gaps.myopic.mean)}%; the battery-aware variant is not significantly different from it on these tiny instances (Wilcoxon *p*=${f2(N.e2_ba_vs_myopic_p)}). Rolling ILP is within ${f1(e2[20].gaps.rolling_ilp.mean)}% on average. The LP relaxation is ${f1(e2[30].lp_gap)}–${f1(e2[15].lp_gap)}% above the optimum. Presolve and cumulative cuts did not help (mean solve time ${f1(e2[30].t_strong)} s with vs ${f1(e2[30].t_plain)} s without for *K*=30).`));
const t2 = [['Policy (gap to ILP, %)', '*K*=15,*R*=5', '*K*=20,*R*=8', '*K*=30,*R*=10']];
for (const [k, nm] of [['random', 'Random'], ['fastest', 'Fastest'], ['myopic', 'Myopic greedy'], ['battery_aware', 'Battery-aware'], ['rolling_ilp', 'Rolling ILP (*W*=3)']])
  t2.push([nm, ...[15, 20, 30].map(K => f1(e2[K].gaps[k].mean))]);
main.push(capT('TABLE II. Mean gap to the exact ILP (8 seeds per size).'));
main.push(table(t2, [1693, 1000, 1000, 1000], { size: 15 }));
main.push(sp());

main.push(sub('C. Large instances'));
main.push(body(`Table III uses 15 seeds of *K*=100, *G*=30, *R*=30 (A) and *K*=60, *G*=12, *R*=20 (B), measured against the battery-free upper bound UB (Rolling ILP, 3 s per window, only 5 seeds; on the same 5 seeds in A it reaches ${f1(p3.K100_G30_R30.first5.rolling_ilp)}% against ${f1(p3.K100_G30_R30.first5.battery_aware)}% for battery-aware and ${f1(p3.K100_G30_R30.first5.myopic)}% for myopic). In A the battery-aware greedy improves on myopic by ${f1(p3.K100_G30_R30.mean_gain)}% on average, winning ${p3.K100_G30_R30.wins}/${p3.K100_G30_R30.n} instances (Wilcoxon *p*<0.001), and reduces exhausted clients from ${f1(A.myopic.exhausted_clients)} to ${f1(A.battery_aware.exhausted_clients)}; in B the coverage gain is smaller (${f1(p3.K60_G12_R20.mean_gain)}%, *p*=${f2(p3.K60_G12_R20.p)}) but full-coverage rounds rise from ${f2(Bc.myopic.full_rounds)} to ${f2(Bc.battery_aware.full_rounds)} and exhausted clients halve. The heuristics need about ${Math.round(1000 * N.scaling.battery_aware_100)} ms for *K*=100 and ${Math.round(1000 * N.scaling.battery_aware_800)} ms for *K*=800 over 30 rounds, versus ${Math.round(A.rolling_ilp.time)} s for Rolling ILP.`));
const t3 = [['Policy', '%UB (A)', 'Exh. (A)', 'Jain (A)', '%UB (B)', 'Full (B)', 'Exh. (B)']];
for (const [k, nm] of [['random', 'Random'], ['fastest', 'Fastest'], ['myopic', 'Myopic'], ['battery_aware', 'Batt.-aware'], ['rolling_ilp', 'Rolling ILP*']])
  t3.push([nm, f1(A[k].pct_ub), f1(A[k].exhausted_clients), f2(A[k].jain), f1(Bc[k].pct_ub), f2(Bc[k].full_rounds), f1(Bc[k].exhausted_clients)]);
main.push(capT('TABLE III. Large instances (means; *Rolling ILP: 5 seeds).'));
main.push(table(t3, [903, 640, 620, 620, 640, 640, 630], { size: 14 }));
main.push(sp());
main.push(...fig('c_compare.png', 307, 352, 'Fig. 1. (a) Gap to the exact ILP on small instances; (b) coverage relative to the upper bound on large instances (error bars: one standard deviation).'));

main.push(sub('D. Tuning γ'));
const gA = g4.K60_G30_R20, gB = g4.K40_G12_R15;
main.push(body(`Fig. 2 sweeps γ over 30 seeds. In the large-*G* setting coverage rises from ${f1(gA['0.0'].cov_pct)}% (γ=0) to ${f1(gA['1.5'].cov_pct)}% at γ=1.5 (*p*<0.001) and plateaus; exhausted clients fall monotonically from ${f1(gA['0.0'].exhausted_clients)} to ${f1(gA['8.0'].exhausted_clients)} and Jain’s index rises. In the small-*G* setting coverage peaks near γ≈0.5–1 (${f1(gB['1.0'].cov_pct)}% vs ${f1(gB['0.0'].cov_pct)}%) and then declines to ${f1(gB['8.0'].cov_pct)}% at γ=8, while exhausted clients fall from ${f1(gB['0.0'].exhausted_clients)} to ${f1(gB['8.0'].exhausted_clients)} and Jain’s index from ${f2(gB['0.0'].jain)} up to ${f2(gB['8.0'].jain)}. Thus γ trades a little coverage for fairness and battery health; γ∈[1,2] is a good default.`));
main.push(...fig('c_gamma.png', 307, 370, 'Fig. 2. Effect of the battery-price weight γ (30 seeds, mean ± s.e.).'));

main.push(sub('E. Adversarial family and energy scarcity'));
const sc = N.e4_scarcity;
main.push(body(`On the family of Proposition 3 the measured ratios of the myopic greedy are 0.667, 0.579, 0.538, 0.515, 0.508 and ${f3(rAdv.ratio_myopic)} for *n*=5,…,1000, exactly (*n*+1)/(2*n*−1). The battery-aware greedy produces the identical schedule (ratio ${f3(rAdv.ratio_battery)}), as predicted, whereas Rolling ILP with *W*=2 is optimal (Fig. 3a). Fig. 3b varies recharge from 0.25× to 4×. The battery-aware gain over myopic is largest under moderate scarcity (${f1(sc['1.0_battery_aware'].cov - sc['1.0_myopic'].cov)} points at 1×, with exhausted clients ${f1(sc['2.0_myopic'].exh)}→${f1(sc['2.0_battery_aware'].exh)} at 2×) and vanishes when energy is very scarce (every client is drained) or abundant (batteries never bind), which delimits when battery awareness matters.`));
main.push(...fig('c_adv.png', 307, 331, 'Fig. 3. (a) ALG/OPT on the adversarial family; (b) coverage vs recharge scale.'));

const ts = [['Recharge scale','Random','Myopic','Batt.-aware','Exh. M→B']];
for (const sc_ of ['0.25','0.5','1.0','2.0','4.0']) ts.push([sc_+'×', f1(sc[sc_+'_random'].cov), f1(sc[sc_+'_myopic'].cov), f1(sc[sc_+'_battery_aware'].cov), f1(sc[sc_+'_myopic'].exh)+'→'+f1(sc[sc_+'_battery_aware'].exh)]);
main.push(capT('TABLE IV. Coverage (%) vs recharge scale (K=60, G=30, R=20, 30 seeds); last column: exhausted clients.'));
main.push(table(ts, [1093, 800, 800, 1000, 1000], { size: 15 }));
main.push(sp());
main.push(sub('F. Fairness variant'));
const e6 = N.e6;
main.push(body(`With the minimum participation constraint (6) on *K*=20, *R*=10 (8 seeds, ILP), forcing ϱ∈{0, 0.1, 0.2} costs no coverage, ϱ=0.3 costs ${f2(e6['0.3'].loss)}%, ϱ=0.4 is feasible for only ${e6['0.4'].feas}/${e6['0.4'].n} instances (loss ${f1(e6['0.4'].loss)}% among them), and ϱ=0.5 is infeasible for all, because batteries cannot sustain that participation rate.`));

main.push(sub('G. Link to FL accuracy'));
main.push(body(`We ran FedAvg (softmax regression, 2 local epochs) on the scikit-learn 8×8 digits data [12] as a stand-in for MNIST (no internet access); the 10 classes are the groups and each client holds exactly its groups’ classes. Over ${N.e7.n} runs (4 policies × 4 values of *m* × 12 seeds) mean per-round coverage and final test accuracy are strongly correlated (Pearson *r*=${f2(N.e7.pearson)}, Spearman ρ=${f2(N.e7.spearman)}; Fig. 4); accuracy rises from ${f1(N.e7_m['2'].acc)}% at ${f1(N.e7_m['2'].cov)}% coverage (*m*=2) to ${f1(N.e7_m['6'].acc)}% at ${f1(N.e7_m['6'].cov)}% (*m*=6). Coverage-driven policies (Myopic ${f1(N.e7_alg.myopic.acc)}%, Battery-aware ${f1(N.e7_alg.battery_aware.acc)}%) beat Random (${f1(N.e7_alg.random.acc)}%) and Fastest (${f1(N.e7_alg.fastest.acc)}%); the Myopic vs Battery-aware accuracy difference is within noise.`));
main.push(...fig('fig_fl.png', 307, 217, 'Fig. 4. Per-round coverage vs final FedAvg accuracy (dashed: linear fit).'));

main.push(sub('H. Reproducibility'));
main.push(body('All code is organised as a Python package (instance generator, checker, greedy algorithms, ILPs, policies, FedAvg) plus one script per experiment (E0–E7), a figure script and a number-export script that feeds this paper. Seeds are fixed per experiment (instances 200+, 300+, 400+, 500+, 600+, 700+ for E2–E7). Every table entry is a mean over the stated number of seeds; ILP runs use a 30 s limit and incumbents are checked by the independent verifier before being used as references. Wall-clock times were measured on a single CPU core and will differ on other machines.'));
main.push(sec('VIII. Discussion and Limitations'));
main.push(body('The battery price is a cheap, online-in-ρ improvement: it needs no forecast of recharge and about 10 ms per run, and it consistently reduces exhausted clients, but its coverage gain is modest (about 1–2%) and it cannot detect budget-driven traps (Proposition 3). Rolling-horizon ILP is near-optimal but needs known recharge/budgets and seconds per decision. Limitations: (i) Theorem 2 does not cover the combined knapsack+cardinality setting; (ii) the exact ILP is solved only up to about 30 clients and 10 rounds within 30 s; (iii) instances are synthetic, and the FL experiment uses a small linear model on the digits data rather than MNIST; (iv) coverage is binary (the probabilistic-coverage and online-recharge variants are left as future work, although the greedy policies are already online in ρ).'));
main.push(body('**Summary of the algorithms.** Random and Fastest-first run in *O*(*R·K* log *K*); ROUND-GREEDY and BATTERY-AWARE in *O*(*R·m·K·G*) with no guarantee beyond the single-round analysis; PARTIAL-ENUM(3) in *O*(*K*^{3}·*m·K·G*) per round with a (1−1/*e*) guarantee for the knapsack case; ROLLING-ILP solves *R* NP-hard windows and is exact only for *W*=*R*. In our runs the quality ordering matched the cost ordering: Rolling ILP > Battery-aware ≳ Myopic ≫ Fastest ≈ Random.'));
main.push(body('**Threats to validity.** Results are synthetic and depend on the generator: we deliberately chose an energy-constrained regime (about as much sustainable participation as the cap *m* allows), and Table IV shows the benefit shrinks outside it. Gaps for the largest exact instances are relative to the incumbent, not a proven optimum, and the Rolling ILP row of Table III uses only five seeds because of its run time. Statistical tests are paired Wilcoxon tests over seeds; we did not correct for multiple comparisons.'));
main.push(sec('IX. Conclusion'));
main.push(body('Multi-round energy-aware client selection is a strongly NP-hard coverage problem whose per-round core admits an optimal-factor greedy, but whose battery coupling defeats myopic selection by up to a factor approaching two. A battery-aware price improves coverage and markedly reduces exhausted clients at negligible cost, and a rolling-horizon ILP comes within about 1–2% of the exact optimum. Future work includes guarantees for the two-constraint round problem, probabilistic coverage, and unknown-recharge competitive analysis.'));

main.push(sec('References'));
const refs = [
  'H. B. McMahan, E. Moore, D. Ramage, S. Hampson, B. A. y Arcas, “Communication-efficient learning of deep networks from decentralized data,” in *Proc. AISTATS*, 2017.',
  'T. Nishio and R. Yonetani, “Client selection for federated learning with heterogeneous resources in mobile edge,” in *Proc. IEEE ICC*, 2019.',
  'S. Khuller, A. Moss, and J. Naor, “The budgeted maximum coverage problem,” *Inf. Process. Lett.*, vol. 70, no. 1, pp. 39–45, 1999.',
  'G. L. Nemhauser, L. A. Wolsey, and M. L. Fisher, “An analysis of approximations for maximizing submodular set functions—I,” *Math. Programming*, vol. 14, pp. 265–294, 1978.',
  'M. Sviridenko, “A note on maximizing a submodular set function subject to a knapsack constraint,” *Oper. Res. Lett.*, vol. 32, no. 1, pp. 41–43, 2004.',
  'R. M. Karp, “Reducibility among combinatorial problems,” in *Complexity of Computer Computations*, Plenum, 1972, pp. 85–103.',
  'M. R. Garey and D. S. Johnson, *Computers and Intractability: A Guide to the Theory of NP-Completeness*, W. H. Freeman, 1979.',
  'U. Feige, “A threshold of ln *n* for approximating set cover,” *J. ACM*, vol. 45, no. 4, pp. 634–652, 1998.',
  'R. Jain, D. Chiu, and W. Hawe, “A quantitative measure of fairness and discrimination for resource allocation in shared computer systems,” DEC Tech. Rep. TR-301, 1984.',
  'Q. Huangfu and J. A. J. Hall, “Parallelizing the dual revised simplex method,” *Math. Program. Comput.*, vol. 10, no. 1, pp. 119–142, 2018.',
  'P. Virtanen *et al.*, “SciPy 1.0: fundamental algorithms for scientific computing in Python,” *Nature Methods*, vol. 17, pp. 261–272, 2020.',
  'F. Pedregosa *et al.*, “Scikit-learn: machine learning in Python,” *J. Mach. Learn. Res.*, vol. 12, pp. 2825–2830, 2011.',
];
refs.forEach((r, i) => main.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 30, line: 220 }, indent: { left: 300, hanging: 300 },
  children: parse(`[${i + 1}]  ${r}`, { font: FONT, size: 16 }) })));

// fix: reference [7] (Garey & Johnson) is cited implicitly with [6]; make it explicit in Theorem 1
const footer = () => new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16 })] })] });
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1080, right: 1080 } };
const doc = new Document({
  creator: 'PS-7 project team', title: 'Energy-Aware Client Selection in Federated Learning',
  styles: { default: { document: { run: { font: FONT, size: SZ } } } },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: D.LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }] }] },
  sections: [
    { properties: { page }, footers: { default: footer() }, children: title },
    { properties: { type: SectionType.CONTINUOUS, page, column: { count: 2, space: 360 } }, footers: { default: footer() }, children: main },
  ],
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync('/mnt/user-data/outputs/PS7_Research_Paper.docx', b); console.log('paper written'); });
