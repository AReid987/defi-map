"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const BASE_SOL = 100;
const BASE_MEME = 1_000_000;
const BASE_K = BASE_SOL * BASE_MEME;
const BASE_PRICE = BASE_SOL / BASE_MEME;
const FEE = 0.003;

type Direction = "buy" | "sell";
type DetailKey = "reserves" | "curve" | "depth";
type ImpactClass = "impact-low" | "impact-med" | "impact-high";

interface DetailData {
  kicker: string;
  title: string;
  body: string;
  key: string;
  rule: string;
}

const DETAILS: Record<DetailKey, DetailData> = {
  reserves: {
    kicker: "A · RESERVES",
    title: "The pool is inventory.",
    body: "A pool holds both assets. A trader can remove MEME only by adding SOL. The reserves do the job an order book normally gives to buyers and sellers.",
    key: "IN ↔ OUT",
    rule: "One side grows while the other shrinks.",
  },
  curve: {
    kicker: "B · CURVE",
    title: "The ratio is the quote.",
    body: "When MEME leaves, it becomes scarcer inside the pool. The curve raises its SOL price with every step of the trade—so your last tokens cost more than your first.",
    key: "x · y = k",
    rule: "Changing reserves changes the quote.",
  },
  depth: {
    kicker: "C · DEPTH",
    title: "Liquidity absorbs force.",
    body: "A deep pool has more inventory to absorb the same order. Its ratio moves less. In a thin pool, even a modest buy can push price hard against the trader.",
    key: "MORE",
    rule: "Deeper inventory means lower price impact.",
  },
};

const LESSONS: { key: DetailKey; index: string; title: string; summary: string; reveal: string; aria: string }[] = [
  {
    key: "reserves",
    index: "A · RESERVES",
    title: "The pool is inventory.",
    summary: "Two assets, held together.",
    reveal: "Trade one side for the other.",
    aria: "Reserves. Focus or tap for more.",
  },
  {
    key: "curve",
    index: "B · CURVE",
    title: "The ratio is the quote.",
    summary: "Scarcity moves price.",
    reveal: "See the pricing rule.",
    aria: "Curve. Focus or tap for more.",
  },
  {
    key: "depth",
    index: "C · DEPTH",
    title: "Liquidity absorbs force.",
    summary: "Deep bends less.",
    reveal: "Compare deep vs. thin.",
    aria: "Depth. Focus or tap for more.",
  },
];

const QUIZ: { text: string; correct: boolean }[] = [
  { text: "MEME gets cheaper because there is less of it", correct: false },
  { text: "MEME gets more expensive because the reserve is scarcer", correct: true },
  { text: "The price stays fixed until an oracle updates it", correct: false },
];

interface NewsPara {
  lead?: string;
  text: string;
}

interface NewsItem {
  date: string;
  headline: string;
  body: NewsPara[];
  sources: string;
}

const NEWS: NewsItem[] = [
  {
    date: "OCT 4, 2026",
    headline: "SHIB landed on Solana. Pools formed in minutes.",
    body: [
      {
        lead: "What happened.",
        text: "Shiba Inu went live on Solana through Sunrise at 16:05 UTC on October 4 — a canonical token under Wormhole's NTT standard, not a wrapped copy.",
      },
      {
        lead: "Twenty-two minutes later.",
        text: "3,005 trades, about $300,000 moved, roughly $514,000 sitting in pools. Nine venues — Jupiter, Raydium, Phantom, Kamino and more — had it tradable within minutes of the announcement.",
      },
      {
        lead: "Why it belongs here.",
        text: "This is the first section happening live: new inventory arrives, both sides of fresh pools fill, and price discovery starts from the first block. A pool doesn't need permission to exist — it needs two assets and a reason.",
      },
      {
        lead: "The caveat.",
        text: "Launch-day snapshots are not sustained demand; the figures cover roughly the first half hour. The lesson stands either way: liquidity forms where attention goes.",
      },
    ],
    sources:
      "Sources: Altcoin Buzz / Solana Compass, Oct 4, 2026; BeInCrypto via CryptoRank, Oct 5, 2026. Early figures only; no later liquidity data in these reports.",
  },
];

function compactNumber(value: number, digits: number): string {
  if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(digits) + "M";
  if (Math.abs(value) >= 1000) return (value / 1000).toFixed(digits) + "K";
  return value.toFixed(digits);
}

function pctClass(value: number): ImpactClass {
  if (value < 3) return "impact-low";
  if (value < 10) return "impact-med";
  return "impact-high";
}

export default function LiquidityPoolsPage() {
  const [direction, setDirection] = useState<Direction>("buy");
  const [amount, setAmount] = useState<number>(5);
  const [deposit, setDeposit] = useState<number>(10);
  const [picked, setPicked] = useState<number | null>(null);
  const [openNews, setOpenNews] = useState<number[]>([]);
  const [openLesson, setOpenLesson] = useState<number | null>(null);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [detail, setDetail] = useState<DetailData>({
    kicker: "A · RESERVES",
    title: "The pool is inventory.",
    body: "",
    key: "IN",
    rule: "One asset enters; the other leaves.",
  });

  const changeTimer = useRef<number | undefined>(undefined);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    document.title = "Liquidity Pools";
  }, []);

  useEffect(() => {
    window.clearTimeout(changeTimer.current);
    setIsChanging(true);
    changeTimer.current = window.setTimeout(() => setIsChanging(false), 180);
    return () => window.clearTimeout(changeTimer.current);
  }, [direction, amount]);

  const buying = direction === "buy";

  const chooseDirection = (next: Direction) => {
    setDirection(next);
    setAmount(next === "buy" ? 5 : 50000);
  };

  // --- Trade simulator (mirrors the source constant-product math) ---
  const effective = amount * (1 - FEE);
  let newSol = BASE_SOL;
  let newMeme = BASE_MEME;
  let output = 0;
  let avgPrice = BASE_PRICE;
  let feeText = "0";
  let inputText: string;
  let outputText: string;

  if (buying) {
    output = amount === 0 ? 0 : BASE_MEME - BASE_K / (BASE_SOL + effective);
    newSol = BASE_SOL + amount;
    newMeme = BASE_MEME - output;
    avgPrice = output === 0 ? BASE_PRICE : amount / output;
    inputText = amount.toFixed(1) + " SOL";
    outputText = Math.round(output).toLocaleString() + " MEME";
    feeText = (amount * FEE).toFixed(4) + " SOL";
  } else {
    output = amount === 0 ? 0 : BASE_SOL - BASE_K / (BASE_MEME + effective);
    newMeme = BASE_MEME + amount;
    newSol = BASE_SOL - output;
    avgPrice = amount === 0 ? BASE_PRICE : output / amount;
    inputText = Math.round(amount).toLocaleString() + " MEME";
    outputText = output.toFixed(3) + " SOL";
    feeText = Math.round(amount * FEE).toLocaleString() + " MEME";
  }

  const newPrice = newSol / newMeme;
  const priceMove = (newPrice / BASE_PRICE - 1) * 100;
  const executionImpact = Math.abs(avgPrice / BASE_PRICE - 1) * 100;
  const product = newSol * newMeme;
  const solHeight = Math.max(14, Math.min(92, (58 * newSol) / BASE_SOL));
  const memeHeight = Math.max(14, Math.min(92, (58 * newMeme) / BASE_MEME));
  const moveColor = priceMove === 0 ? "var(--ink)" : priceMove > 0 ? "var(--good)" : "var(--bad)";

  // --- LP / ownership simulator ---
  const depositMeme = deposit * (BASE_MEME / BASE_SOL);
  const share = deposit / (BASE_SOL + deposit);
  const feeShare = share * 10 * FEE;

  // --- Concept check ---
  const feedback =
    picked === null
      ? "Pick the answer that follows the pool’s inventory."
      : QUIZ[picked].correct
        ? "Yes. Less MEME remains, so MEME costs more SOL."
        : "Follow the inventory: less MEME means a higher MEME price.";

  const openDetail = (key: DetailKey) => {
    setDetail(DETAILS[key]);
    dialogRef.current?.showModal();
  };

  return (
    <main className={styles["page"]}>
      <section className={styles["hero"]} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles["sequence"]}>
            <i />
            <span>FIELD GUIDE 01 · THE FOUNDATION</span>
          </div>
          <h1 id="hero-title">Two assets. One self-balancing market.</h1>
          <p>Push one asset in. Pull the other out. The price moves.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles["primary-link"]} href="#lab">
              Touch the pool
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
        <div className={styles["pool-orbit"]} aria-label="SOL and MEME tokens orbiting a constant-product liquidity pool">
          <span className={`${styles["coin"]} ${styles["coin-sol"]}`}>SOL</span>
          <span className={`${styles["coin"]} ${styles["coin-meme"]}`}>MEME</span>
          <span className={`${styles["orbit-arrow"]} ${styles["arrow-a"]}`}>↗</span>
          <span className={`${styles["orbit-arrow"]} ${styles["arrow-b"]}`}>↗</span>
          <div className={styles["orbit-label"]}>
            <div>
              <strong>x · y</strong>
              <span>stays near k</span>
            </div>
          </div>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-intro"]}>
          <div className={styles["section-no"]}>01 / TOUCH IT</div>
          <div>
            <h2 id="lab-title">Trade. Watch it react.</h2>
            <p>Every trade changes the ratio. The ratio is the price.</p>
          </div>
        </div>

        <div className={`${styles["lab-shell"]}${isChanging ? ` ${styles["is-changing"]}` : ""}`}>
          <div className={styles["lab-top"]}>
            <div className={styles["pool-id"]}>
              <div className={styles["mini-coins"]} aria-hidden="true">
                <span className={`${styles["mini-coin"]} ${styles["mini-sol"]}`}>S</span>
                <span className={`${styles["mini-coin"]} ${styles["mini-meme"]}`}>M</span>
              </div>
              <div>
                <strong>SOL / MEME</strong>
                <span>interactive teaching pool</span>
              </div>
            </div>
            <span className={styles["model-tag"]}>0.30% FEE · x·y=k</span>
          </div>

          <div className={styles["lab-grid"]}>
            <div className={styles["visual-panel"]}>
              <div className={styles["metric-strip"]} aria-live="polite">
                <div className={styles["metric"]}>
                  <span>MEME price</span>
                  <strong>{newPrice.toFixed(6)} SOL</strong>
                </div>
                <div className={styles["metric"]}>
                  <span>Price move</span>
                  <strong style={{ color: moveColor }}>
                    {(priceMove >= 0 ? "+" : "") + priceMove.toFixed(2)}%
                  </strong>
                </div>
                <div className={styles["metric"]}>
                  <span>Pool product</span>
                  <strong>{compactNumber(product, 2)}</strong>
                </div>
              </div>
              <div className={styles["pool-viz"]}>
                <div className={styles["tank-wrap"]}>
                  <div className={styles["tank-label"]}>
                    <span>SOL reserve</span>
                    <strong>{newSol.toFixed(2)}</strong>
                  </div>
                  <div className={styles["tank"]}>
                    <div
                      className={`${styles["liquid"]} ${styles["liquid-sol"]}`}
                      style={{ height: solHeight + "%" }}
                    />
                  </div>
                </div>
                <div className={styles["formula"]}>
                  <b>×</b>
                  <span>
                    RESERVES
                    <br />
                    SET PRICE
                  </span>
                </div>
                <div className={styles["tank-wrap"]}>
                  <div className={styles["tank-label"]}>
                    <span>MEME reserve</span>
                    <strong>{compactNumber(newMeme, 2)}</strong>
                  </div>
                  <div className={styles["tank"]}>
                    <div
                      className={`${styles["liquid"]} ${styles["liquid-meme"]}`}
                      style={{ height: memeHeight + "%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles["control-panel"]}>
              <div className={styles["trade-tabs"]} aria-label="Trade direction">
                <button
                  className={styles["trade-tab"]}
                  aria-pressed={buying}
                  type="button"
                  onClick={() => chooseDirection("buy")}
                >
                  Buy MEME
                </button>
                <button
                  className={styles["trade-tab"]}
                  aria-pressed={!buying}
                  type="button"
                  onClick={() => chooseDirection("sell")}
                >
                  Sell MEME
                </button>
              </div>
              <div className={styles["trade-head"]}>
                <h3>{buying ? "Push SOL into the pool" : "Push MEME into the pool"}</h3>
                <p>
                  {buying
                    ? "The pool releases MEME and raises its price."
                    : "The pool releases SOL and lowers MEME’s price."}
                </p>
              </div>
              <div className={styles["amount-readout"]}>
                <div className={styles["amount-line"]}>
                  <span>You put in</span>
                  <strong>{inputText}</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={buying ? 25 : 250000}
                  step={buying ? 0.5 : 5000}
                  value={amount}
                  aria-label="Trade amount"
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>0 SOL</span>
                  <span>{buying ? "25 SOL" : "250K MEME"}</span>
                </div>
              </div>
              <div className={styles["you-get"]}>
                <span>You receive ≈</span>
                <strong>{outputText}</strong>
              </div>
              <div className={styles["impact-list"]}>
                <div className={styles["impact-row"]}>
                  <span>Average execution price</span>
                  <strong>{avgPrice.toFixed(6)} SOL</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Price impact</span>
                  <strong className={styles[pctClass(executionImpact)]}>
                    {executionImpact.toFixed(2)}%
                  </strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Fee left for LPs</span>
                  <strong>{feeText}</strong>
                </div>
              </div>
              <p className={styles["control-tip"]}>Push harder. The price bends faster.</p>
            </div>
          </div>
        </div>

        <div className={styles["lesson-grid"]} aria-label="Three parts of a pool trade">
          {LESSONS.map((lesson, i) => (
            <article
              key={lesson.key}
              className={`${styles["lesson"]}${openLesson === i ? ` ${styles["is-open"]}` : ""}`}
              tabIndex={0}
              aria-label={lesson.aria}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("[data-open-detail]")) return;
                setOpenLesson((prev) => (prev === i ? null : i));
              }}
            >
              <span className={styles["lesson-index"]}>{lesson.index}</span>
              <h3>{lesson.title}</h3>
              <p className={styles["lesson-summary"]}>{lesson.summary}</p>
              <div className={styles["lesson-reveal"]}>
                <span>{lesson.reveal}</span>
                <button
                  className={styles["detail-button"]}
                  type="button"
                  data-open-detail={lesson.key}
                  onClick={() => openDetail(lesson.key)}
                >
                  Open detail
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className={styles["touch-hint"]}>Tap a card, then open its detail.</p>
      </section>

      <section className={styles["lp-section"]} aria-labelledby="lp-title">
        <div className={styles["ownership-card"]}>
          <div className={styles["ownership-copy"]}>
            <div className={styles["section-no"]}>02 / FLIP SIDES</div>
            <h2 id="lp-title">Now become the pool.</h2>
            <p>Add both assets. Own part of the pool—and its fees.</p>
          </div>
          <div className={styles["ownership-controls"]}>
            <label htmlFor="depositRange">Add SOL and the matching MEME</label>
            <input
              id="depositRange"
              type="range"
              min={1}
              max={25}
              step={1}
              value={deposit}
              aria-label="SOL deposit amount"
              onChange={(e) => setDeposit(Number(e.target.value))}
            />
            <div className={styles["deposit-value"]}>
              <span>Your deposit</span>
              <strong>
                {deposit.toFixed(0)} SOL + {Math.round(depositMeme).toLocaleString()} MEME
              </strong>
            </div>
            <div className={styles["ownership-results"]}>
              <div className={styles["result-box"]}>
                <span>Your pool share</span>
                <strong>{(share * 100).toFixed(2)}%</strong>
              </div>
              <div className={styles["result-box"]}>
                <span>Of a 10 SOL trade fee</span>
                <strong>{feeShare.toFixed(4)} SOL</strong>
              </div>
            </div>
            <p className={styles["fee-note"]}>Fees grow. Your token mix keeps moving.</p>
          </div>
        </div>
      </section>

      <section className={styles["checkpoint"]} aria-labelledby="quiz-title">
        <div className={styles["checkpoint-grid"]}>
          <div>
            <div className={styles["section-no"]}>03 / CHECKPOINT</div>
            <h2 id="quiz-title">Read the pool</h2>
            <p>A trader buys a lot of MEME. What moves?</p>
          </div>
          <div>
            <div className={styles["choices"]} role="group" aria-label="Quiz answers">
              {QUIZ.map((q, i) => (
                <button
                  key={i}
                  className={`${styles["choice"]}${
                    picked === i ? (q.correct ? ` ${styles["correct"]}` : ` ${styles["wrong"]}`) : ""
                  }`}
                  type="button"
                  onClick={() => setPicked(i)}
                >
                  {q.text}
                </button>
              ))}
            </div>
            <div className={styles["quiz-feedback"]} aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      </section>

      <section className={styles["thisweek"]} aria-labelledby="thisweek-title">
        <div className={styles["section-intro"]}>
          <div className={styles["section-no"]}>04 / THIS WEEK</div>
          <div>
            <h2 id="thisweek-title">Watch a pool be born.</h2>
            <p>A listing, minute by minute. Tap the date for the deeper layer.</p>
          </div>
        </div>
        <div>
          {NEWS.map((item, i) => {
            const open = openNews.includes(i);
            return (
              <article key={item.date} className={styles["news-item"]}>
                <button
                  type="button"
                  className={styles["news-btn"]}
                  aria-expanded={open}
                  onClick={() =>
                    setOpenNews((prev) =>
                      prev.includes(i)
                        ? prev.filter((x) => x !== i)
                        : [...prev, i],
                    )
                  }
                >
                  <span className={styles["news-date"]}>{item.date}</span>
                  <span className={styles["news-headline"]}>
                    {item.headline}
                  </span>
                  <span className={styles["news-plus"]} aria-hidden="true">
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open && (
                  <div className={styles["news-body"]}>
                    <span aria-hidden="true" />
                    <div>
                      {item.body.map((para, j) => (
                        <p key={j}>
                          {para.lead ? <strong>{para.lead} </strong> : null}
                          {para.text}
                        </p>
                      ))}
                      <p className={styles["news-src"]}>{item.sources}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles["takeaway"]} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE ONE-LINER</div>
        <blockquote>Trading changes inventory. Inventory changes price.</blockquote>
      </section>
      <p className={styles["fine-print"]}>Simplified constant-product model. Real pools vary. Not trading advice.</p>

      <dialog
        ref={dialogRef}
        className={styles["detail-dialog"]}
        aria-labelledby="detailTitle"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <div className={styles["dialog-inner"]}>
          <div className={styles["dialog-top"]}>
            <div>
              <span className={styles["dialog-kicker"]}>{detail.kicker}</span>
              <h3 id="detailTitle">{detail.title}</h3>
            </div>
            <button
              className={styles["dialog-close"]}
              type="button"
              aria-label="Close detail"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <p>{detail.body}</p>
          <div className={styles["dialog-rule"]}>
            <b>{detail.key}</b>
            <span>{detail.rule}</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
