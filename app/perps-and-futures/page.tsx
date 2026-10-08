"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MINUS = "−";
const ENTRY = 100;
const MAINTENANCE = 0.05;

function cash(n: number, d = 0): string {
  return (
    (n < 0 ? MINUS + "$" : "$") +
    Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
  );
}
function signedCash(n: number): string {
  return (
    (n >= 0 ? "+$" : MINUS + "$") +
    Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
function signedPct(n: number, d: number): string {
  return (n > 0 ? "+" : n < 0 ? MINUS : "") + Math.abs(n).toFixed(d) + "%";
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type DetailKey = "exposure" | "perp" | "future";

const details: Record<
  DetailKey,
  { kicker: string; title: string; body: string; key: string; rule: string }
> = {
  exposure: {
    kicker: "A · EXPOSURE",
    title: "You trade a price contract.",
    body: "A derivative can create long or short exposure without buying or borrowing the underlying coin. Profit and loss track the contract’s notional size as its reference price moves.",
    key: "P&L",
    rule: "Notional × price move × direction.",
  },
  perp: {
    kicker: "B · PERPETUAL",
    title: "The clock does not expire.",
    body: "A perpetual futures contract can stay open while margin holds. Recurring funding payments between long and short traders help pull the contract price toward the underlying spot market.",
    key: "PERP",
    rule: "No expiry; funding is the recurring tether.",
  },
  future: {
    kicker: "C · FUTURE",
    title: "The contract has a date.",
    body: "A dated future settles or expires at a defined time. Its price can trade above or below spot before then, and that basis usually converges as settlement approaches.",
    key: "DATE",
    rule: "Expiry replaces the perpetual funding tether.",
  },
};

const cards: { key: DetailKey; index: string; heading: string; sub: string; reveal: string }[] = [
  {
    key: "exposure",
    index: "A · EXPOSURE",
    heading: "No underlying SOL required.",
    sub: "You still post collateral.",
    reveal: "Price exposure.",
  },
  {
    key: "perp",
    index: "B · PERPETUAL",
    heading: "No expiry.",
    sub: "Funding keeps it near spot.",
    reveal: "Rolling contract.",
  },
  {
    key: "future",
    index: "C · FUTURE",
    heading: "A date ends it.",
    sub: "Settlement closes the clock.",
    reveal: "Dated contract.",
  },
];

const quizChoices: { text: string; correct: boolean }[] = [
  { text: "You lose about 4% of margin", correct: false },
  { text: "You lose about 40% of margin", correct: true },
  { text: "Nothing until the contract expires", correct: false },
];

export default function PerpsAndFuturesPage() {
  const [side, setSide] = useState<"long" | "short">("long");
  const [margin, setMargin] = useState(1000);
  const [leverage, setLeverage] = useState(5);
  const [move, setMove] = useState(5);
  const [funding, setFunding] = useState(0.01);
  const [tugRate, setTugRate] = useState(0.05);
  const [openCards, setOpenCards] = useState<Record<DetailKey, boolean>>({
    exposure: false,
    perp: false,
    future: false,
  });
  const [detail, setDetail] = useState<DetailKey | null>(null);
  const [quiz, setQuiz] = useState<{ index: number; correct: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    document.title = "Perps and Futures";
  }, []);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (detail) {
      if (!dlg.open) dlg.showModal();
    } else if (dlg.open) {
      dlg.close();
    }
  }, [detail]);

  // Perpetual position simulator — mirrors the source update() math exactly.
  const m = margin;
  const lev = leverage;
  const movePct = move / 100;
  const rate = funding / 100;
  const dir = side === "long" ? 1 : -1;
  const notional = m * lev;
  const trading = notional * movePct * dir;
  const fundingPayment = notional * rate * dir;
  const net = trading - fundingPayment;
  const equity = m + net;
  const liqMove = (1 / lev - MAINTENANCE) * (side === "long" ? -1 : 1);
  const liqPrice = ENTRY * (1 + liqMove);
  const mark = ENTRY * (1 + movePct);
  const liquidated = side === "long" ? movePct <= liqMove : movePct >= liqMove;
  const markTop = clamp(48 - movePct * 300, 8, 92);
  const liqTop = clamp(48 - liqMove * 300, 8, 92);
  const beamTop = Math.min(48, markTop);
  const beamHeight = Math.max(2, Math.abs(48 - markTop));
  const remaining = Math.max(0, (equity / m) * 100);
  const equityBg = remaining < 40 ? "var(--bad)" : remaining < 80 ? "var(--orange)" : "var(--acid)";
  const stateLabel = liquidated ? "LIQUIDATED" : net > 0 ? "PROFIT" : net < 0 ? "LOSS" : "FLAT";
  const stateColor = liquidated || net < 0 ? "var(--bad)" : net > 0 ? "var(--acid)" : "var(--bg)";
  const note = liquidated
    ? "The mark has crossed this model’s liquidation line."
    : `A ${Math.abs(movePct * 100).toFixed(0)}% price move produces about a ${Math.abs(
        movePct * lev * 100
      ).toFixed(0)}% ${trading >= 0 ? "gain" : "loss"} on margin before funding and fees.`;

  // Funding-direction toy.
  const tugLabel = `${signedPct(tugRate, 2)} / 8h:`;
  const tugLong = tugRate > 0 ? "PAY" : tugRate < 0 ? "RECEIVE" : "NEUTRAL";
  const tugShort = tugRate > 0 ? "RECEIVE" : tugRate < 0 ? "PAY" : "NEUTRAL";
  const tugArrow = tugRate > 0 ? "→" : tugRate < 0 ? "←" : "—";
  const tugExplain =
    tugRate > 0
      ? "positive funding generally means longs pay shorts."
      : tugRate < 0
        ? "negative funding generally means shorts pay longs."
        : "a zero rate means no funding transfer this interval.";

  // Concept check.
  const feedback =
    quiz === null
      ? "Follow the notional, not just the collateral."
      : quiz.correct
        ? "Exactly. $10,000 notional × 4% = $400, or 40% of margin."
        : "10× turns $1,000 of margin into $10,000 of price exposure.";

  const detailData = detail ? details[detail] : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles.eyebrow}>
            <i></i>
            <span>FIELD GUIDE 05 · PERPS &amp; FUTURES</span>
          </div>
          <h1 id="hero-title">Trade the move. Not the coin.</h1>
          <p>Choose a side. Add leverage. Manage the line.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles.cta} href="#lab">
              Open a position{" "}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5v14M6 13l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <span className={styles["hero-note"]}>No wallet. No stakes.</span>
          </div>
        </div>
        <div
          className={styles["contract-machine"]}
          aria-label="Abstract perpetual contract market with rising candles and leverage"
        >
          <div className={styles.screen}>
            <div className={styles["screen-top"]}>
              <span>SOL-PERP · MARK</span>
              <b>CONTRACT OPEN</b>
            </div>
            <div className={styles.chart} aria-hidden="true">
              <i className={styles["price-line"]}></i>
              <i className={`${styles.candle} ${styles.c1}`}></i>
              <i className={`${styles.candle} ${styles.c2}`}></i>
              <i className={`${styles.candle} ${styles.c3}`}></i>
              <i className={`${styles.candle} ${styles.c4}`}></i>
              <i className={`${styles.candle} ${styles.c5}`}></i>
              <i className={`${styles.candle} ${styles.c6}`}></i>
              <span className={styles["mark-tag"]}>MARK ↑</span>
            </div>
          </div>
          <div className={styles["direction-chip"]}>LONG · PRICE ↑</div>
          <div className={styles["leverage-chip"]}>
            <div>
              <b>5×</b>
              <small>NOTIONAL</small>
            </div>
          </div>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / TAKE A SIDE</div>
          <div>
            <h2 id="lab-title">A small move gets loud.</h2>
            <p>Leverage magnifies gains and losses—not certainty.</p>
          </div>
        </div>
        <div className={styles.lab}>
          <div className={styles["lab-bar"]}>
            <div className={styles["position-id"]}>
              <span className={styles["position-icon"]}>P</span>
              <div>
                <strong>SOL perpetual</strong>
                <small>simplified isolated-margin model</small>
              </div>
            </div>
            <span className={styles["lab-tag"]}>5% MAINTENANCE MARGIN</span>
          </div>
          <div className={styles["lab-grid"]}>
            <div className={styles.stage}>
              <div className={styles.scoreboard} aria-live="polite">
                <div className={styles.score}>
                  <span>Notional exposure</span>
                  <strong id="notionalOut">{cash(notional)}</strong>
                </div>
                <div className={styles.score}>
                  <span>Net P&amp;L</span>
                  <strong id="pnlOut" className={net >= 0 ? styles.good : styles.bad}>
                    {signedCash(net)}
                  </strong>
                </div>
                <div className={styles.score}>
                  <span>Margin equity</span>
                  <strong id="equityOut" className={equity >= m ? styles.good : styles.bad}>
                    {cash(Math.max(0, equity), 2)}
                  </strong>
                </div>
              </div>
              <div
                className={
                  liquidated
                    ? `${styles["position-stage"]} ${styles["is-liquidated"]}`
                    : styles["position-stage"]
                }
                id="positionStage"
                aria-label="Entry, mark, and simplified liquidation levels"
              >
                <div className={styles["price-axis"]}></div>
                <div
                  className={styles["position-beam"]}
                  id="positionBeam"
                  style={{ top: `${beamTop}%`, height: `${beamHeight}%` }}
                ></div>
                <div className={styles["entry-pin"]} id="entryPin">
                  <span className={styles["pin-copy"]}>
                    <b>$100.00</b>
                    <small>ENTRY</small>
                  </span>
                </div>
                <div
                  className={styles["mark-pin"]}
                  id="markPin"
                  style={{ top: `${markTop}%` }}
                >
                  <span className={styles["pin-copy"]}>
                    <b id="markPrice">{cash(mark, 2)}</b>
                    <small>MARK</small>
                  </span>
                </div>
                <div
                  className={styles["liq-pin"]}
                  id="liqPin"
                  style={{ top: `${liqTop}%` }}
                >
                  <span className={styles["pin-copy"]}>
                    <b id="liqPrice">{cash(liqPrice, 2)}</b>
                    <small>EST. LIQUIDATION</small>
                  </span>
                </div>
                <div className={styles.liquidated}>LIQUIDATION ZONE</div>
              </div>
              <div className={styles["equity-panel"]}>
                <div className={styles["equity-top"]}>
                  <div>
                    <span>Collateral remaining</span>
                    <strong id="remainingOut">{`${remaining.toFixed(0)}%`}</strong>
                  </div>
                  <strong id="stateOut" style={{ color: stateColor }}>
                    {stateLabel}
                  </strong>
                </div>
                <div className={styles["equity-track"]}>
                  <div
                    className={styles["equity-fill"]}
                    id="equityFill"
                    style={{ width: `${Math.min(100, remaining)}%`, background: equityBg }}
                  ></div>
                </div>
              </div>
            </div>
            <div className={styles.controls}>
              <div className={styles.direction} role="group" aria-label="Position direction">
                <button
                  type="button"
                  data-side="long"
                  className={side === "long" ? styles.active : undefined}
                  onClick={() => setSide("long")}
                >
                  LONG ↑
                </button>
                <button
                  type="button"
                  data-side="short"
                  className={side === "short" ? styles.active : undefined}
                  onClick={() => setSide("short")}
                >
                  SHORT ↓
                </button>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="margin">Margin</label>
                  <output id="marginOut">{cash(m)}</output>
                </div>
                <p>Collateral backing the position.</p>
                <input
                  id="margin"
                  type="range"
                  min={250}
                  max={5000}
                  step={250}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>$250</span>
                  <span>$5K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="leverage">Leverage</label>
                  <output id="leverageOut">{`${lev}×`}</output>
                </div>
                <p>Notional exposure ÷ margin.</p>
                <input
                  id="leverage"
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>1×</span>
                  <span>20×</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="move">Price move</label>
                  <output id="moveOut">{signedPct(movePct * 100, 0)}</output>
                </div>
                <p>Mark price versus entry.</p>
                <input
                  id="move"
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={move}
                  onChange={(e) => setMove(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>−40%</span>
                  <span>+40%</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="funding">Funding / 8 hours</label>
                  <output id="fundingOut">{signedPct(rate * 100, 2)}</output>
                </div>
                <p>Positive means longs pay shorts.</p>
                <input
                  id="funding"
                  type="range"
                  min={-0.1}
                  max={0.1}
                  step={0.01}
                  value={funding}
                  onChange={(e) => setFunding(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>−0.10%</span>
                  <span>+0.10%</span>
                </div>
              </div>
              <div className={styles["impact-box"]}>
                <div className={styles["impact-row"]}>
                  <span>Trading P&amp;L</span>
                  <strong id="tradePnlOut">{signedCash(trading)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>One funding payment</span>
                  <strong id="fundingPaymentOut">{signedCash(-fundingPayment)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Approx. liquidation move</span>
                  <strong id="liqMoveOut">{signedPct(liqMove * 100, 1)}</strong>
                </div>
                <p id="positionNote">{note}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contracts} aria-labelledby="contracts-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>02 / OPEN THE CONTRACT</div>
          <div>
            <h2 id="contracts-title">Same bet. Different clock.</h2>
            <p>Tap a card. See what the contract changes.</p>
          </div>
        </div>
        <div className={styles.cards}>
          {cards.map((c) => (
            <article
              key={c.key}
              tabIndex={0}
              className={openCards[c.key] ? `${styles.card} ${styles.open}` : styles.card}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                setOpenCards((p) => ({ ...p, [c.key]: !p[c.key] }));
              }}
            >
              <span className={styles["card-index"]}>{c.index}</span>
              <h3>{c.heading}</h3>
              <p>{c.sub}</p>
              <div className={styles.reveal}>
                <span>{c.reveal}</span>
                <button
                  className={styles["detail-btn"]}
                  type="button"
                  data-detail={c.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetail(c.key);
                  }}
                >
                  Open detail
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.funding} aria-labelledby="funding-title">
        <div className={styles["funding-copy"]}>
          <div className={styles["section-no"]}>03 / THE TUG</div>
          <h2 id="funding-title">Crowded sides pay rent.</h2>
          <p>Funding passes value between longs and shorts.</p>
        </div>
        <div className={styles["funding-panel"]}>
          <label htmlFor="tugRate">Move the funding rate</label>
          <input
            id="tugRate"
            type="range"
            min={-0.1}
            max={0.1}
            step={0.01}
            value={tugRate}
            onChange={(e) => setTugRate(Number(e.target.value))}
          />
          <div className={styles.payer}>
            <div className={styles["side-box"]}>
              <b>LONGS</b>
              <span id="longStatus">{tugLong}</span>
            </div>
            <div className={styles["flow-arrow"]} id="flowArrow">
              {tugArrow}
            </div>
            <div className={styles["side-box"]}>
              <b>SHORTS</b>
              <span id="shortStatus">{tugShort}</span>
            </div>
          </div>
          <p className={styles["funding-note"]}>
            <b id="tugLabel">{tugLabel}</b> <span id="tugExplain">{tugExplain}</span> Exchanges
            calculate and cap it differently.
          </p>
        </div>
      </section>

      <section className={styles.checkpoint} aria-labelledby="check-title">
        <div className={styles["check-grid"]}>
          <div>
            <div className={styles["section-no"]}>04 / CHECKPOINT</div>
            <h2 id="check-title">Read the position</h2>
            <p>
              You post $1,000 at 10× leverage and the market moves 4% against you. Roughly what
              happens before fees?
            </p>
          </div>
          <div>
            <div className={styles.choices} role="group" aria-label="Quiz answers">
              {quizChoices.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  data-answer={c.correct ? "correct" : "wrong"}
                  className={
                    quiz && quiz.index === i
                      ? quiz.correct
                        ? `${styles.choice} ${styles.correct}`
                        : `${styles.choice} ${styles.wrong}`
                      : styles.choice
                  }
                  onClick={() => setQuiz({ index: i, correct: c.correct })}
                >
                  {c.text}
                </button>
              ))}
            </div>
            <div className={styles.feedback} id="feedback" aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.takeaway} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE ONE-LINER</div>
        <blockquote>
          Leverage magnifies gains and losses on your margin. Margin is the buffer before
          liquidation.
        </blockquote>
      </section>
      <p className={styles.fine}>
        Simplified teaching model: fixed $100 entry, linear P&amp;L, isolated margin, one funding
        interval, and an illustrative 5% maintenance margin. Real venues use mark-price rules,
        fees, tiered maintenance margins, funding caps, liquidation penalties, insurance funds, and
        contract-specific settlement. Not trading advice.
      </p>

      <dialog
        ref={dialogRef}
        id="detailDialog"
        aria-labelledby="detailTitle"
        onClose={() => setDetail(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setDetail(null);
        }}
      >
        <div className={styles["dialog-inner"]}>
          <div className={styles["dialog-top"]}>
            <div>
              <span className={styles["dialog-kicker"]} id="detailKicker">
                {detailData?.kicker ?? ""}
              </span>
              <h3 id="detailTitle">{detailData?.title ?? ""}</h3>
            </div>
            <button
              className={styles.close}
              id="dialogClose"
              type="button"
              aria-label="Close detail"
              onClick={() => setDetail(null)}
            >
              ×
            </button>
          </div>
          <p className={styles["dialog-body"]} id="detailBody">
            {detailData?.body ?? ""}
          </p>
          <div className={styles["dialog-rule"]}>
            <b id="detailKey">{detailData?.key ?? ""}</b>
            <span id="detailRule">{detailData?.rule ?? ""}</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
