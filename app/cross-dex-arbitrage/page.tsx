"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import styles from "./page.module.css";

const BASE = 0.0001;
const SWAP_FEE = 0.003;

function signed(n: number, d: number, suffix: string): string {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(d) + suffix;
}

type DetailKey = "gap" | "impact" | "cost";

interface DetailContent {
  kicker: string;
  title: string;
  body: string;
  key: string;
  rule: string;
}

const DETAILS: Record<DetailKey, DetailContent> = {
  gap: {
    kicker: "A · GAP",
    title: "Liquidity is fragmented.",
    body: "Two pools can hold different reserve ratios, so the same token gets two prices. A trade, a fresh listing, uneven liquidity, or a delayed update can open the difference.",
    key: "START",
    rule: "A quote difference is potential—not profit.",
  },
  impact: {
    kicker: "B · IMPACT",
    title: "The route repairs the mismatch.",
    body: "Buying MEME on the cheaper pool raises its marginal price. Selling MEME on the expensive pool lowers its marginal price. Larger orders push harder, pulling the two pools toward agreement.",
    key: "CURVE",
    rule: "Your own size consumes the opportunity.",
  },
  cost: {
    kicker: "C · COST",
    title: "The round trip has two tolls.",
    body: "Both swaps charge fees. Price impact, priority fees, aggregator fees, token rules, and failed attempts can take more. What remains after every cost is the executable edge.",
    key: "NET",
    rule: "Profit = SOL returned − SOL spent − execution cost.",
  },
};

interface CardDef {
  index: string;
  title: string;
  text: string;
  reveal: string;
  detail: DetailKey;
}

const CARDS: CardDef[] = [
  { index: "A · GAP", title: "Markets disagree.", text: "The opening appears.", reveal: "Creates the edge.", detail: "gap" },
  { index: "B · IMPACT", title: "Your trade bends both.", text: "The opening closes.", reveal: "Consumes the edge.", detail: "impact" },
  { index: "C · COST", title: "Fees take the cut.", text: "Only the remainder is profit.", reveal: "Filters the edge.", detail: "cost" },
];

interface ChoiceDef {
  text: string;
  answer: "correct" | "wrong";
}

const CHOICES: ChoiceDef[] = [
  { text: "Yes—the price gap is positive", answer: "wrong" },
  { text: "No—the edge is gone before network costs", answer: "correct" },
  { text: "Yes, if the expensive DEX has more volume", answer: "wrong" },
];

const FEEDBACK_INITIAL = "Count every bite taken from the gap.";
const FEEDBACK_CORRECT = "Exactly. 0.6% + 1.7% already exceeds the 2% gap.";
const FEEDBACK_WRONG = "Subtract swap fees and slippage before calling the gap an edge.";

export default function CrossDexArbitragePage() {
  const [gap, setGap] = useState(4);
  const [trade, setTrade] = useState(20);
  const [liquidity, setLiquidity] = useState(1500);
  const [cost, setCost] = useState(0.03);
  const [latency, setLatency] = useState(150);
  const [detail, setDetail] = useState<DetailKey | null>(null);
  const [openCards, setOpenCards] = useState<boolean[]>([false, false, false]);
  const [picked, setPicked] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    document.title = "Cross-DEX Arbitrage";
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (detail && !d.open) {
      d.showModal();
    } else if (!detail && d.open) {
      d.close();
    }
  }, [detail]);

  // --- two-pool route simulator (two constant-product pools) ---
  const g = gap / 100;
  const q = trade;
  const depth = liquidity;
  const execCost = cost;
  const pLow = BASE * (1 - g / 2);
  const pHigh = BASE * (1 + g / 2);
  const x1 = depth;
  const y1 = x1 / pLow;
  const x2 = depth;
  const y2 = x2 / pHigh;
  const effectiveIn = q * (1 - SWAP_FEE);
  const tokens = (y1 * effectiveIn) / (x1 + effectiveIn);
  const x1After = x1 + q;
  const y1After = y1 - tokens;
  const tokenIn = tokens * (1 - SWAP_FEE);
  const solBack = (x2 * tokenIn) / (y2 + tokenIn);
  const x2After = x2 - solBack;
  const y2After = y2 + tokens;
  const profit = solBack - q - execCost;
  const roi = (profit / q) * 100;
  const afterLow = x1After / y1After;
  const afterHigh = x2After / y2After;
  const afterGap = (Math.abs(afterHigh - afterLow) / ((afterHigh + afterLow) / 2)) * 100;
  const gross = (pHigh / pLow - 1) * 100;
  const feeApprox = q * SWAP_FEE + solBack * SWAP_FEE;
  const midpoint = (afterHigh + afterLow) / 2;
  const spread = Math.min(45, (Math.abs(afterHigh - afterLow) / midpoint) * 260);
  const profitClass = profit >= 0 ? styles.good : styles.bad;

  // --- execution-delay model ---
  const risk = Math.min(100, latency / 15);

  const feedback =
    picked === null
      ? FEEDBACK_INITIAL
      : CHOICES[picked].answer === "correct"
        ? FEEDBACK_CORRECT
        : FEEDBACK_WRONG;

  const onCardClick = (idx: number) => (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setOpenCards((prev) => prev.map((open, i) => (i === idx ? !open : open)));
  };

  const current = detail ? DETAILS[detail] : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><i></i><span>FIELD GUIDE 04 · CROSS-DEX ARBITRAGE</span></div>
          <h1 id="hero-title">One coin. Two prices.</h1>
          <p>Buy the gap. Sell the gap. Keep what survives.</p>
          <div className={styles.heroActions}><a className={styles.cta} href="#lab">Run the route <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></a><span className={styles.heroNote}>No wallet. No stakes.</span></div>
        </div>
        <div className={styles.routeMachine} aria-label="A token traveling between two decentralized exchanges with different prices">
          <div className={`${styles.dex} ${styles.dexA}`}><div className={styles.dexTop}><span>DEX A</span><i className={styles.liveDot}></i></div><div className={styles.dexPrice}><b>0.000098</b><span>SOL per MEME</span></div></div>
          <div className={`${styles.dex} ${styles.dexB}`}><div className={styles.dexTop}><span>DEX B</span><i className={styles.liveDot}></i></div><div className={styles.dexPrice}><b>0.000102</b><span>SOL per MEME</span></div></div>
          <div className={styles.routeLoop} aria-hidden="true"></div><div className={styles.packet}>MEME</div><div className={styles.edgeChip}>BUY-LOW EDGE <b>4.08%</b></div>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles.sectionHead}><div className={styles.sectionNo}>01 / ROUTE IT</div><div><h2 id="lab-title">The edge has a size limit.</h2><p>Your own trade pushes both prices together.</p></div></div>
        <div className={styles.lab}>
          <div className={styles.labBar}><div className={styles.routeId}><div className={styles.pairCoins}><span className={`${styles.coin} ${styles.coinSol}`}>S</span><span className={`${styles.coin} ${styles.coinMeme}`}>M</span></div><div><strong>SOL → MEME → SOL</strong><small>two constant-product pools</small></div></div><span className={styles.labTag}>0.30% FEE · EACH SWAP</span></div>
          <div className={styles.labGrid}>
            <div className={styles.stage}>
              <div className={styles.scoreboard} aria-live="polite">
                <div className={styles.score}><span>Gross buy-low edge</span><strong>{gross.toFixed(2)}%</strong></div>
                <div className={styles.score}><span>Route profit</span><strong className={profitClass}>{signed(profit, 2, " SOL")}</strong></div>
                <div className={styles.score}><span>Return on trade</span><strong className={profitClass}>{signed(roi, 2, "%")}</strong></div>
              </div>
              <div className={styles.tradePath}>
                <div className={`${styles.market} ${styles.low}`}><span className={styles.marketLabel}>DEX A · LOW</span><strong>{pLow.toFixed(6)}</strong><small>SOL / MEME</small><span className={styles.marketAction}>BUY MEME</span></div>
                <div className={styles.pathArrow} aria-hidden="true"><i className={styles.pathPulse}></i></div>
                <div className={`${styles.market} ${styles.high}`}><span className={styles.marketLabel}>DEX B · HIGH</span><strong>{pHigh.toFixed(6)}</strong><small>SOL / MEME</small><span className={styles.marketAction}>SELL MEME</span></div>
              </div>
              <div className={styles.convergence}><div className={styles.convergenceTop}><div><span>Prices after your route</span><strong>{afterGap.toFixed(2)}% apart</strong></div><strong style={{ color: profit > 0 ? "var(--lime)" : "var(--bad)" }}>{profit > 0 ? "EDGE CAPTURED" : "NO EDGE"}</strong></div><div className={styles.tracks} aria-hidden="true"><div className={styles.track}></div><i className={`${styles.priceDot} ${styles.dotLow}`} style={{ left: `${50 - spread}%` }}></i><i className={`${styles.priceDot} ${styles.dotHigh}`} style={{ left: `${50 + spread}%` }}></i></div></div>
            </div>
            <div className={styles.controls}>
              <div className={styles.control}><div className={styles.controlTop}><label htmlFor="gap">Mid-price spread</label><output>{gap.toFixed(1)}%</output></div><p>Symmetric difference around the midpoint.</p><input id="gap" type="range" min="0.2" max="10" step="0.2" value={gap} onChange={(e) => setGap(parseFloat(e.target.value))} /><div className={styles.rangeEnds}><span>0.2%</span><span>10%</span></div></div>
              <div className={styles.control}><div className={styles.controlTop}><label htmlFor="trade">Trade size</label><output>{q.toFixed(0)} SOL</output></div><p>SOL sent into the cheaper pool.</p><input id="trade" type="range" min="1" max="150" step="1" value={trade} onChange={(e) => setTrade(parseFloat(e.target.value))} /><div className={styles.rangeEnds}><span>1 SOL</span><span>150 SOL</span></div></div>
              <div className={styles.control}><div className={styles.controlTop}><label htmlFor="liquidity">Liquidity per side</label><output>{depth.toLocaleString()} SOL</output></div><p>Deeper pools bend less.</p><input id="liquidity" type="range" min="100" max="5000" step="100" value={liquidity} onChange={(e) => setLiquidity(parseFloat(e.target.value))} /><div className={styles.rangeEnds}><span>100 SOL</span><span>5K SOL</span></div></div>
              <div className={styles.control}><div className={styles.controlTop}><label htmlFor="cost">Priority + network cost</label><output>{execCost.toFixed(2)} SOL</output></div><p>Execution cost paid whether the route wins or loses.</p><input id="cost" type="range" min="0" max="1" step="0.01" value={cost} onChange={(e) => setCost(parseFloat(e.target.value))} /><div className={styles.rangeEnds}><span>0</span><span>1 SOL</span></div></div>
              <div className={styles.impactBox}><div className={styles.impactRow}><span>MEME acquired</span><strong>{Math.round(tokens).toLocaleString()}</strong></div><div className={styles.impactRow}><span>SOL returned</span><strong>{solBack.toFixed(2)} SOL</strong></div><div className={styles.impactRow}><span>Round-trip swap fees</span><strong>≈{feeApprox.toFixed(2)} SOL</strong></div><p>{profit > 0 ? "The gap is wider than fees, impact, and execution cost." : "Fees, impact, and execution cost have consumed the gap."}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mechanics} aria-labelledby="mechanics-title">
        <div className={styles.sectionHead}><div className={styles.sectionNo}>02 / OPEN THE ROUTE</div><div><h2 id="mechanics-title">Profit lives between four forces.</h2><p>Tap a card. Follow where the edge goes.</p></div></div>
        <div className={styles.cards}>
          {CARDS.map((card, idx) => (
            <article
              key={card.index}
              className={`${styles.card}${openCards[idx] ? ` ${styles.open}` : ""}`}
              tabIndex={0}
              onClick={onCardClick(idx)}
            >
              <span className={styles.cardIndex}>{card.index}</span><h3>{card.title}</h3><p>{card.text}</p>
              <div className={styles.reveal}><span>{card.reveal}</span><button className={styles.detailBtn} type="button" onClick={(e) => { e.stopPropagation(); setDetail(card.detail); }}>Open detail</button></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.race} aria-labelledby="race-title">
        <div className={styles.raceCopy}><div className={styles.sectionNo}>03 / THE RACE</div><h2 id="race-title">A stale quote is not a trade.</h2><p>Between seeing and landing, the market can move.</p></div>
        <div className={styles.racePanel}><label htmlFor="latency">Add execution delay</label><input id="latency" type="range" min="0" max="1500" step="50" value={latency} onChange={(e) => setLatency(parseFloat(e.target.value))} /><div className={styles.raceReadout}><div className={styles.readout}><span>Illustrative delay</span><strong>{latency.toLocaleString()} ms</strong></div><div className={styles.readout}><span>Edge at risk</span><strong>{Math.round(risk)}%</strong></div></div><div className={styles.raceTrack} aria-hidden="true"><div className={styles.raceFill} style={{ width: `${Math.max(2, risk)}%` }}></div><span className={styles.raceMarker}>QUOTE DECAY</span></div><p className={styles.raceNote}><b>Atomic execution changes the failure mode:</b> both swaps settle together or the route reverts. It does not guarantee profit; fees and priority costs can still be paid.</p></div>
      </section>

      <section className={styles.checkpoint} aria-labelledby="check-title"><div className={styles.checkGrid}><div><div className={styles.sectionNo}>04 / CHECKPOINT</div><h2 id="check-title">Read the route</h2><p>A 2% gap appears, but your route costs 0.6% in swap fees and 1.7% in slippage. Trade?</p></div><div><div className={styles.choices} role="group" aria-label="Quiz answers">{CHOICES.map((choice, idx) => (
        <button
          key={choice.text}
          className={`${styles.choice}${picked === idx ? ` ${choice.answer === "correct" ? styles.correct : styles.wrong}` : ""}`}
          type="button"
          onClick={() => setPicked(idx)}
        >{choice.text}</button>
      ))}</div><div className={styles.feedback} aria-live="polite">{feedback}</div></div></div></section>

      <section className={styles.takeaway} aria-label="Core takeaway"><div className={styles.sectionNo}>THE ONE-LINER</div><blockquote>Arbitrage is not finding a gap. It is landing the round trip before the gap disappears.</blockquote></section>
      <p className={styles.fine}>Simplified teaching model: two constant-product pools, equal starting SOL depth, a fixed 0.30% swap fee on each leg, no transfer taxes, and no failed-transaction fee model. Real routes can include aggregator fees, account costs, validator tips, stale quotes, token restrictions, and competition. Not trading advice.</p>

      <dialog
        ref={dialogRef}
        id="detailDialog"
        aria-labelledby="detailTitle"
        onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}
        onCancel={() => setDetail(null)}
      >
        <div className={styles.dialogInner}><div className={styles.dialogTop}><div><span className={styles.dialogKicker}>{current ? current.kicker : ""}</span><h3 id="detailTitle">{current ? current.title : ""}</h3></div><button className={styles.close} type="button" aria-label="Close detail" onClick={() => setDetail(null)}>×</button></div><p className={styles.dialogBody}>{current ? current.body : ""}</p><div className={styles.dialogRule}><b>{current ? current.key : ""}</b><span>{current ? current.rule : ""}</span></div></div>
      </dialog>
    </main>
  );
}
