"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const MINUS = "\u2212";

function cash(n: number): string {
  return (n < 0 ? MINUS + "$" : "$") + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function signedCash(n: number): string {
  return (n >= 0 ? "+$" : MINUS + "$") + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function signedPct(n: number, d: number): string {
  return (n > 0 ? "+" : n < 0 ? MINUS : "") + Math.abs(n).toFixed(d) + "%";
}

type DetailKey = "deposit" | "borrow" | "repeat";

interface Detail {
  kicker: string;
  title: string;
  body: string;
  key: string;
  rule: string;
}

const DETAILS: Record<DetailKey, Detail> = {
  deposit: {
    kicker: "A \u00b7 DEPOSIT",
    title: "Collateral creates capacity.",
    body: "The first asset deposit backs the loan. The protocol values it through an oracle and assigns a borrowing limit. A volatile asset can lose borrowing power as its price falls.",
    key: "BASE",
    rule: "Collateral value is the denominator of LTV.",
  },
  borrow: {
    kicker: "B \u00b7 BORROW",
    title: "Debt creates pressure.",
    body: "Borrowed stablecoins are swapped into more of the collateral asset. The debt stays owed, and interest can grow it. Your usable cushion is the gap between current LTV and the liquidation threshold.",
    key: "GAUGE",
    rule: "Debt \u00f7 collateral value = LTV.",
  },
  repeat: {
    kicker: "C \u00b7 REPEAT",
    title: "The circle becomes leverage.",
    body: "Each new asset purchase is redeposited, creating room for another smaller loan. The geometric stack raises exposure without adding fresh starting capital, so gains and losses both act on more assets.",
    key: "STACK",
    rule: "More rounds approach a limit; they never create free equity.",
  },
};

const LAYER_LABELS = ["START", "LOOP 1", "LOOP 2", "LOOP 3", "LOOP 4", "LOOP 5"];

const CARDS: { key: DetailKey; index: string; title: string; copy: string; hint: string }[] = [
  { key: "deposit", index: "A \u00b7 DEPOSIT", title: "Collateral goes in.", copy: "Your borrowing base begins.", hint: "Sets the base." },
  { key: "borrow", index: "B \u00b7 BORROW", title: "Debt comes out.", copy: "LTV becomes the pressure gauge.", hint: "Creates the debt." },
  { key: "repeat", index: "C \u00b7 REPEAT", title: "Exposure stacks up.", copy: "Returns and losses both get louder.", hint: "Multiplies the move." },
];

const CHOICES = [
  "Only the first SOL deposit",
  "The whole collateral stack, while debt stays fixed",
  "Nothing until the position is liquidated",
];
const CORRECT_INDEX = 1;

export default function LoopingPage() {
  const [capital, setCapital] = useState(1000);
  const [borrowPct, setBorrowPct] = useState(60);
  const [loops, setLoops] = useState(4);
  const [priceMovePct, setPriceMovePct] = useState(0);
  const [openCards, setOpenCards] = useState<Record<DetailKey, boolean>>({ deposit: false, borrow: false, repeat: false });
  const [detailKey, setDetailKey] = useState<DetailKey | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.title = "Looping";
  }, []);

  // ---- model math (ported 1:1 from the static page) ----
  const start = capital;
  const r = borrowPct / 100;
  const n = loops;
  const move = priceMovePct / 100;
  let gross = 0;
  const layerAmounts: number[] = [];
  let amount = start;
  for (let i = 0; i <= n; i++) {
    gross += amount;
    layerAmounts.push(amount);
    amount *= r;
  }
  const debt = gross - start;
  const currentCollateral = gross * (1 + move);
  const equity = currentCollateral - debt;
  const pnl = equity - start;
  const ltv = currentCollateral > 0 ? (debt / currentCollateral) * 100 : 999;
  const liqDrop = debt > 0 ? (1 - debt / (gross * 0.8)) * 100 : 100;

  const healthState = ltv >= 80 ? "Liquidation zone" : ltv >= 68 ? "At risk" : ltv >= 52 ? "Warming" : "Roomy";
  const healthColor = ltv >= 80 ? "var(--bad)" : ltv >= 68 ? "var(--warn)" : ltv >= 52 ? "var(--yellow)" : "var(--acid)";
  const healthPinLeft = Math.max(0, Math.min(100, (ltv / 80) * 100)) + "%";
  const liqDropText = debt === 0 ? "No debt" : liqDrop >= 0 ? MINUS + liqDrop.toFixed(1) + "%" : "Already past";
  const impactNote =
    ltv >= 80
      ? "The model has crossed its illustrative liquidation threshold."
      : n === 0
        ? "No borrowing means no loop and no liquidation from debt."
        : "The loop amplifies the asset move across the whole stack.";
  const feedback =
    picked === null
      ? "Pick the answer that follows the full loop."
      : picked === CORRECT_INDEX
        ? "Exactly. The full stack moves; the stable debt remains."
        : "Trace the borrowed SOL too: every layer is exposed to the move.";

  const openDetail = (key: DetailKey) => {
    setDetailKey(key);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
  };

  const toggleCard = (key: DetailKey, target: EventTarget | null) => {
    if (target instanceof HTMLElement && target.closest("button")) return;
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const detail = detailKey ? DETAILS[detailKey] : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles.eyebrow}>
            <i></i>
            <span>FIELD GUIDE 03 · LOOPING</span>
          </div>
          <h1 id="hero-title">Turn one deposit into a stack.</h1>
          <p>Deposit. Borrow. Buy more. Repeat.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles.cta} href="#lab">
              Build the loop{" "}
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <span className={styles["hero-note"]}>No wallet. No stakes.</span>
          </div>
        </div>
        <div className={styles["loop-machine"]} aria-label="A looping cycle of deposit, borrow, and redeposit">
          <div className={styles["machine-plate"]}>
            <div className={styles["machine-grid"]}></div>
            <div className={styles.orbit}></div>
            <div className={styles.core}>
              <div>
                <b>1 → 2.3×</b>
                <small>EXPOSURE</small>
              </div>
            </div>
          </div>
          <span className={`${styles.node} ${styles.n1}`}>DEPOSIT</span>
          <span className={`${styles.node} ${styles.n2}`}>BORROW</span>
          <span className={`${styles.node} ${styles.n3}`}>BUY MORE</span>
          <span className={`${styles.arrow} ${styles.a1}`}>↘</span>
          <span className={`${styles.arrow} ${styles.a2}`}>↙</span>
          <span className={`${styles.arrow} ${styles.a3}`}>↖</span>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / STACK IT</div>
          <div>
            <h2 id="lab-title">More exposure. Same starting cash.</h2>
            <p>Each round gets smaller. The debt does not disappear.</p>
          </div>
        </div>
        <div className={styles.lab}>
          <div className={styles["lab-bar"]}>
            <div className={styles["position-id"]}>
              <span className={styles["mini-orbit"]} aria-hidden="true"></span>
              <div>
                <strong>SOL collateral loop</strong>
                <small>simplified teaching model</small>
              </div>
            </div>
            <span className={styles["lab-tag"]}>STABLE DEBT · 80% LIQ. THRESHOLD</span>
          </div>
          <div className={styles["lab-grid"]}>
            <div className={styles.stage}>
              <div className={styles.scoreboard} aria-live="polite">
                <div className={styles.score}>
                  <span>Gross exposure</span>
                  <strong>{cash(currentCollateral)}</strong>
                </div>
                <div className={styles.score}>
                  <span>Debt</span>
                  <strong>{cash(debt)}</strong>
                </div>
                <div className={styles.score}>
                  <span>Net equity</span>
                  <strong className={equity >= start ? styles.good : styles.bad}>{cash(equity)}</strong>
                </div>
              </div>
              <div className={styles["stack-scene"]} aria-label="Six possible collateral layers; active layers depend on the loop count">
                <div className={styles["stack-base"]}>
                  {LAYER_LABELS.map((label, i) => (
                    <div
                      key={label}
                      className={`${styles.layer}${i > n ? ` ${styles.off}` : ""}`}
                      data-level={String(i)}
                    >
                      <span>{label}</span>
                      <b>{i <= n ? (i === 0 ? "" : "+") + cash(layerAmounts[i]) : (i === 0 ? "" : "+") + cash(0)}</b>
                    </div>
                  ))}
                </div>
                <div className={styles["stack-arrow"]}>
                  <span>COLLATERAL</span>
                </div>
                <span className={styles["stack-caption"]}>
                  {n} borrow {n === 1 ? "round" : "rounds"}
                </span>
              </div>
              <div className={styles.health}>
                <div className={styles["health-top"]}>
                  <div>
                    <span>Current loan-to-value</span>
                    <strong>{ltv.toFixed(1)}%</strong>
                  </div>
                  <div className={styles["health-state"]} style={{ color: healthColor }}>
                    {healthState}
                  </div>
                </div>
                <div className={styles["health-track"]} aria-hidden="true">
                  <div className={styles["health-pin"]} style={{ left: healthPinLeft }}></div>
                </div>
                <div className={styles.threshold}>
                  <span>0% LTV</span>
                  <span>80% → liquidation zone</span>
                </div>
              </div>
            </div>
            <div className={styles.controls}>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="capital">Starting capital</label>
                  <output>{cash(start)}</output>
                </div>
                <p>Your first collateral deposit.</p>
                <input id="capital" type="range" min={500} max={5000} step={250} value={capital} onChange={(e) => setCapital(Number(e.target.value))} />
                <div className={styles["range-ends"]}>
                  <span>$500</span>
                  <span>$5K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="borrowRate">Borrow each round</label>
                  <output>{Math.round(r * 100)}%</output>
                </div>
                <p>How much of each fresh deposit gets borrowed.</p>
                <input id="borrowRate" type="range" min={30} max={75} step={5} value={borrowPct} onChange={(e) => setBorrowPct(Number(e.target.value))} />
                <div className={styles["range-ends"]}>
                  <span>30%</span>
                  <span>75%</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="loops">Borrow rounds</label>
                  <output>{n}</output>
                </div>
                <p>Borrow, buy, and redeposit.</p>
                <input id="loops" type="range" min={0} max={5} step={1} value={loops} onChange={(e) => setLoops(Number(e.target.value))} />
                <div className={styles["range-ends"]}>
                  <span>0</span>
                  <span>5</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="priceMove">Collateral price move</label>
                  <output>{signedPct(move * 100, 0)}</output>
                </div>
                <p>Debt stays fixed while collateral moves.</p>
                <input id="priceMove" type="range" min={-55} max={50} step={1} value={priceMovePct} onChange={(e) => setPriceMovePct(Number(e.target.value))} />
                <div className={styles["range-ends"]}>
                  <span>−55%</span>
                  <span>+50%</span>
                </div>
              </div>
              <div className={styles["impact-box"]}>
                <div className={styles["impact-row"]}>
                  <span>Exposure multiple</span>
                  <strong>{(gross / start).toFixed(2)}×</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Position P&amp;L</span>
                  <strong style={{ color: pnl < 0 ? "var(--bad)" : "var(--good)" }}>{signedCash(pnl)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Liquidation price drop</span>
                  <strong>{liqDropText}</strong>
                </div>
                <p>{impactNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cycle} aria-labelledby="cycle-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>02 / OPEN THE LOOP</div>
          <div>
            <h2 id="cycle-title">Three moves. One leveraged position.</h2>
            <p>Tap through the mechanics hiding inside the circle.</p>
          </div>
        </div>
        <div className={styles["cycle-grid"]}>
          {CARDS.map((card) => (
            <article
              key={card.key}
              className={`${styles["cycle-card"]}${openCards[card.key] ? ` ${styles.open}` : ""}`}
              tabIndex={0}
              onClick={(e) => toggleCard(card.key, e.target)}
            >
              <span className={styles["card-index"]}>{card.index}</span>
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
              <div className={styles.reveal}>
                <span>{card.hint}</span>
                <button
                  className={styles["detail-btn"]}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(card.key);
                  }}
                >
                  Open detail
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.cascade} aria-labelledby="cascade-title">
        <div className={styles["cascade-copy"]}>
          <div className={styles["section-no"]}>03 / THE CASCADE</div>
          <h2 id="cascade-title">Down moves squeeze the loop.</h2>
          <p>Collateral shrinks. Debt does not. LTV climbs.</p>
        </div>
        <div className={styles["cascade-flow"]}>
          <div className={styles.flow}>
            <div className={styles["flow-step"]}>
              <b>PRICE ↓</b>
              <span>collateral value falls</span>
            </div>
            <span className={styles["flow-arrow"]}>→</span>
            <div className={styles["flow-step"]}>
              <b>LTV ↑</b>
              <span>the cushion thins</span>
            </div>
            <span className={styles["flow-arrow"]}>→</span>
            <div className={styles["flow-step"]}>
              <b>SELL</b>
              <span>liquidation repays debt</span>
            </div>
          </div>
          <p className={styles["cascade-note"]}>
            <b>Interest tightens it too:</b> growing debt can raise LTV even when the asset price stands still.
          </p>
        </div>
      </section>

      <section className={styles.checkpoint} aria-labelledby="check-title">
        <div className={styles["check-grid"]}>
          <div>
            <div className={styles["section-no"]}>04 / CHECKPOINT</div>
            <h2 id="check-title">Read the risk</h2>
            <p>A loop shows 2.3× SOL exposure. SOL falls 10%. What gets hit?</p>
          </div>
          <div>
            <div className={styles.choices} role="group" aria-label="Quiz answers">
              {CHOICES.map((choice, i) => (
                <button
                  key={choice}
                  className={`${styles.choice}${picked === i ? ` ${i === CORRECT_INDEX ? styles.correct : styles.wrong}` : ""}`}
                  type="button"
                  onClick={() => setPicked(i)}
                >
                  {choice}
                </button>
              ))}
            </div>
            <div className={styles.feedback} aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.takeaway} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE ONE-LINER</div>
        <blockquote>A loop is leverage built one borrow at a time.</blockquote>
      </section>
      <p className={styles.fine}>
        Simplified model: one volatile collateral asset, stable debt, instant swaps, no fees, no slippage, no interest, and an illustrative 80%
        liquidation threshold. Real protocols set their own collateral factors, thresholds, oracle rules, rates, and liquidation penalties. Not trading
        advice.
      </p>

      <dialog
        ref={dialogRef}
        aria-labelledby="detailTitle"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
        onClose={() => setDetailKey(null)}
      >
        <div className={styles["dialog-inner"]}>
          <div className={styles["dialog-top"]}>
            <div>
              <span className={styles["dialog-kicker"]}>{detail?.kicker ?? ""}</span>
              <h3 id="detailTitle">{detail?.title ?? ""}</h3>
            </div>
            <button className={styles.close} type="button" aria-label="Close detail" onClick={closeDialog}>
              ×
            </button>
          </div>
          <p className={styles["dialog-body"]}>{detail?.body ?? ""}</p>
          <div className={styles["dialog-rule"]}>
            <b>{detail?.key ?? ""}</b>
            <span>{detail?.rule ?? ""}</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
