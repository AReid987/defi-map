"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type DetailKey = "fees" | "emissions" | "position";

interface DetailContent {
  kicker: string;
  title: string;
  body: string;
  key: string;
  rule: string;
}

const details: Record<DetailKey, DetailContent> = {
  fees: {
    kicker: "A · FEES",
    title: "Traders pay the pool.",
    body: "Swap fees come from activity. Your LP position earns its share before any extra farm incentive. Fee APR can still fall when volume fades or when more liquidity competes for the same flow.",
    key: "FLOW",
    rule: "Volume creates fees; TVL divides them.",
  },
  emissions: {
    kicker: "B · EMISSIONS",
    title: "Tokens boost the headline.",
    body: "A protocol can distribute new tokens to attract deposits. That incentive is real, but its dollar value depends on the reward token holding value while recipients sell or compound it.",
    key: "PRINT",
    rule: "A reward token can dilute while APR looks high.",
  },
  position: {
    kicker: "C · POSITION",
    title: "Farming wraps LP risk.",
    body: "Staking an LP receipt does not remove exposure to the pool. Price divergence, impermanent loss, thin liquidity, smart-contract risk, and withdrawal rules still sit underneath the rewards.",
    key: "BASE",
    rule: "Farm return sits on top of pool P&L.",
  },
};

const cards: { key: DetailKey; index: string; title: string; blurb: string; tag: string }[] = [
  { key: "fees", index: "A · FEES", title: "Traders pay.", blurb: "Usage creates cash flow.", tag: "Demand-driven." },
  { key: "emissions", index: "B · EMISSIONS", title: "The protocol prints.", blurb: "Rewards attract liquidity.", tag: "Supply-driven." },
  { key: "position", index: "C · POSITION", title: "The pool still moves.", blurb: "LP risk never clocks out.", tag: "Underlying risk." },
];

const choices: { text: string; answer: "correct" | "wrong" }[] = [
  { text: "How often rewards can be claimed", answer: "wrong" },
  { text: "Emissions, token sell pressure, and real fee flow", answer: "correct" },
  { text: "Whether the APR number is the largest on the page", answer: "wrong" },
];

function money(n: number): string {
  return "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function signed(n: number, d: number): string {
  return (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(d) + "%";
}

function compact(n: number): string {
  return n >= 1000000 ? "$" + (n / 1000000).toFixed(1) + "M" : "$" + Math.round(n / 1000) + "K";
}

export default function YieldFarmingPage() {
  const [deposit, setDeposit] = useState(2500);
  const [feeApr, setFeeApr] = useState(18);
  const [rewardApr, setRewardApr] = useState(72);
  const [rewardMovePct, setRewardMovePct] = useState(-60);
  const [tvl, setTvl] = useState(500000);
  const [picked, setPicked] = useState<number | null>(null);
  const [openCards, setOpenCards] = useState<Record<DetailKey, boolean>>({
    fees: false,
    emissions: false,
    position: false,
  });
  const [detail, setDetail] = useState<DetailKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    document.title = "Yield Farming";
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

  // Farm engine (30-day simple APR model)
  const move = rewardMovePct / 100;
  const adjustedRewards = rewardApr * (1 + move);
  const fee30 = (feeApr * 30) / 365;
  const reward30 = (adjustedRewards * 30) / 365;
  const total = fee30 + reward30;
  const quoted = ((feeApr + rewardApr) * 30) / 365;
  const maxBar = Math.max(quoted, fee30, reward30, 1);
  const feeBarH = Math.max(5, (fee30 / maxBar) * 100);
  const rewardBarH = Math.max(5, (Math.abs(reward30) / maxBar) * 100);
  const quoteBarH = Math.max(5, (quoted / maxBar) * 100);
  const returnColor = total < 0 ? "var(--bad)" : "var(--bg)";
  const returnUsd = (total >= 0 ? "+" : "−") + money((deposit * total) / 100) + " on $" + deposit.toLocaleString();

  // TVL dilution model
  const crowdApr = (365000 / tvl) * 100;
  const crowdFillW = 8 + (92 * (tvl - 100000)) / 4900000;

  // Concept check feedback
  const feedback =
    picked === null
      ? "Pick the answer that traces where value comes from."
      : choices[picked].answer === "correct"
        ? "Exactly. Separate real demand from token incentives."
        : "Start at the source: fees, emissions, and the reward token’s value.";

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles.eyebrow}>
            <i></i>
            <span>FIELD GUIDE 02 · YIELD FARMING</span>
          </div>
          <h1 id="hero-title">Put your pool position to work.</h1>
          <p>Stake the receipt. Collect the flow. Then ask what pays it.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles.cta} href="#lab">
              Run the farm{" "}
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
        <div className={styles["farm-machine"]} aria-label="LP token enters a farm and reward tokens flow out">
          <div className={styles["machine-body"]}>
            <div className={styles["machine-top"]}>
              <span>FARM ENGINE</span>
              <i className={styles["status-dot"]}></i>
            </div>
            <div className={styles["machine-core"]}>
              <div className={styles["flow-line"]}></div>
              <div className={styles["stake-disc"]}>
                <div>
                  <b>LP →</b>
                  <small>STAKED</small>
                </div>
              </div>
              <i className={`${styles.drop} ${styles.d1}`}></i>
              <i className={`${styles.drop} ${styles.d2}`}></i>
              <i className={`${styles.drop} ${styles.d3}`}></i>
            </div>
          </div>
          <span className={`${styles.token} ${styles["lp-token"]}`}>LP</span>
          <span className={`${styles.token} ${styles["reward-token"]}`}>RWD</span>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / RUN IT</div>
          <div>
            <h2 id="lab-title">A big APR can shrink.</h2>
            <p>Fees are earned. Emissions are priced.</p>
          </div>
        </div>
        <div className={styles.lab}>
          <div className={styles["lab-bar"]}>
            <div className={styles.pair}>
              <div className={styles["pair-coins"]}>
                <span className={`${styles["pair-coin"]} ${styles["pc-sol"]}`}>S</span>
                <span className={`${styles["pair-coin"]} ${styles["pc-meme"]}`}>M</span>
              </div>
              <div>
                <strong>SOL / MEME farm</strong>
                <small>teaching model</small>
              </div>
            </div>
            <span className={styles["lab-tag"]}>30 DAYS · SIMPLE APR</span>
          </div>
          <div className={styles["lab-grid"]}>
            <div className={styles["yield-stage"]}>
              <div className={styles["total-return"]}>
                <div>
                  <span>30-day farm return</span>
                  <strong id="returnPct" style={{ color: returnColor }}>
                    {signed(total, 2)}
                  </strong>
                </div>
                <small id="returnUsd">{returnUsd}</small>
              </div>
              <div className={styles["yield-stack"]} aria-live="polite">
                <div className={styles.column}>
                  <div className={styles["column-label"]}>
                    Fee yield<b id="feeResult">{signed(fee30, 2)}</b>
                  </div>
                  <div className={styles["bar-shell"]}>
                    <div
                      className={`${styles["bar-fill"]} ${styles["fees-fill"]}`}
                      id="feeBar"
                      style={{ height: feeBarH + "%" }}
                    ></div>
                  </div>
                </div>
                <div className={styles.column}>
                  <div className={styles["column-label"]}>
                    Reward yield<b id="rewardResult">{signed(reward30, 2)}</b>
                  </div>
                  <div className={styles["bar-shell"]}>
                    <div
                      className={`${styles["bar-fill"]} ${styles["emissions-fill"]}`}
                      id="rewardBar"
                      style={{ height: rewardBarH + "%" }}
                    ></div>
                  </div>
                </div>
                <div className={styles.column}>
                  <div className={styles["column-label"]}>
                    Quoted yield<b id="quoteResult">{signed(quoted, 2)}</b>
                  </div>
                  <div className={styles["bar-shell"]}>
                    <div
                      className={`${styles["bar-fill"]} ${styles["combined-fill"]}`}
                      id="quoteBar"
                      style={{ height: quoteBarH + "%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.controls}>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="deposit">LP position</label>
                  <output id="depositOut">${deposit.toLocaleString()}</output>
                </div>
                <p>Value deposited into the farm.</p>
                <input
                  id="deposit"
                  type="range"
                  min={500}
                  max={10000}
                  step={250}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>$500</span>
                  <span>$10K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="feeApr">Trading-fee APR</label>
                  <output id="feeAprOut">{feeApr}%</output>
                </div>
                <p>Flow from swaps in the pool.</p>
                <input
                  id="feeApr"
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={feeApr}
                  onChange={(e) => setFeeApr(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>0%</span>
                  <span>60%</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="rewardApr">Reward APR</label>
                  <output id="rewardAprOut">{rewardApr}%</output>
                </div>
                <p>Tokens emitted to attract liquidity.</p>
                <input
                  id="rewardApr"
                  type="range"
                  min={0}
                  max={300}
                  step={2}
                  value={rewardApr}
                  onChange={(e) => setRewardApr(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>0%</span>
                  <span>300%</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="rewardPrice">Reward-token move</label>
                  <output id="rewardPriceOut">{signed(rewardMovePct, 0)}</output>
                </div>
                <p>Price change before rewards are sold.</p>
                <input
                  id="rewardPrice"
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={rewardMovePct}
                  onChange={(e) => setRewardMovePct(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>−100%</span>
                  <span>+100%</span>
                </div>
              </div>
              <div className={styles["control-note"]}>
                <b id="headlineApr">{(feeApr + rewardApr).toFixed(0)}% quoted APR</b> becomes{" "}
                <b id="effectiveApr">{(feeApr + adjustedRewards).toFixed(1)}% price-adjusted</b>. Pool P&amp;L is not
                included.
              </div>
            </div>
          </div>
        </div>

        <div className={styles["sources-grid"]} aria-label="Sources of farm returns">
          {cards.map((c) => (
            <article
              key={c.key}
              className={styles["source-card"] + (openCards[c.key] ? " " + styles.open : "")}
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement | null)?.closest("button")) return;
                setOpenCards((prev) => ({ ...prev, [c.key]: !prev[c.key] }));
              }}
            >
              <span className={styles["card-index"]}>{c.index}</span>
              <h3>{c.title}</h3>
              <p>{c.blurb}</p>
              <div className={styles.reveal}>
                <span>{c.tag}</span>
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

      <section className={styles.crowd} aria-labelledby="crowd-title">
        <div className={styles["crowd-card"]}>
          <div className={styles["crowd-copy"]}>
            <div className={styles["section-no"]}>02 / SHARE THE TAP</div>
            <h2 id="crowd-title">More farmers. Thinner slices.</h2>
            <p>A fixed reward budget gets split across all staked value.</p>
          </div>
          <div className={styles["crowd-control"]}>
            <label htmlFor="tvl">Move liquidity into the farm</label>
            <input
              id="tvl"
              type="range"
              min={100000}
              max={5000000}
              step={100000}
              value={tvl}
              onChange={(e) => setTvl(Number(e.target.value))}
            />
            <div className={styles["crowd-readout"]}>
              <div className={styles.readout}>
                <span>Total value staked</span>
                <strong id="tvlOut">{compact(tvl)}</strong>
              </div>
              <div className={styles.readout}>
                <span>Reward APR</span>
                <strong id="crowdApr">{crowdApr.toFixed(1)}%</strong>
              </div>
            </div>
            <div className={styles["crowd-track"]} aria-hidden="true">
              <div
                className={styles["crowd-fill"]}
                id="crowdFill"
                style={{ width: crowdFillW + "%" }}
              ></div>
            </div>
            <p className={styles["control-note"]}>
              Fixed budget: <b>$1,000/day</b>. As TVL rises, rewards are divided across more capital.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.checkpoint} aria-labelledby="check-title">
        <div className={styles["check-grid"]}>
          <div>
            <div className={styles["section-no"]}>03 / CHECKPOINT</div>
            <h2 id="check-title">Read the yield</h2>
            <p>A farm shows 180% APR, mostly paid in its own token. What do you inspect first?</p>
          </div>
          <div>
            <div className={styles.choices} role="group" aria-label="Quiz answers">
              {choices.map((c, i) => (
                <button
                  key={i}
                  className={
                    styles.choice +
                    (picked === i ? (c.answer === "correct" ? " " + styles.correct : " " + styles.wrong) : "")
                  }
                  type="button"
                  data-answer={c.answer}
                  onClick={() => setPicked(i)}
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
        <blockquote>Yield is not magic. Trace who pays—and what gets diluted.</blockquote>
      </section>
      <p className={styles.fine}>
        Simplified teaching model. APR is not APY. Token prices, pool value, impermanent loss, incentives, lockups,
        smart-contract risk, and fees can change actual returns. Not trading advice.
      </p>

      <dialog
        id="detailDialog"
        ref={dialogRef}
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
                {detail ? details[detail].kicker : ""}
              </span>
              <h3 id="detailTitle">{detail ? details[detail].title : ""}</h3>
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
            {detail ? details[detail].body : ""}
          </p>
          <div className={styles["dialog-rule"]}>
            <b id="detailKey">{detail ? details[detail].key : ""}</b>
            <span id="detailRule">{detail ? details[detail].rule : ""}</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
