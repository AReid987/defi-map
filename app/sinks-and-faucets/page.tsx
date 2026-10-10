"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import styles from "./page.module.css";

type PresetKey = "selloff" | "quiet" | "broken";
type DetailKey = "transfer" | "faucet" | "sink" | "anchor";

const PRESETS: Record<PresetKey, [number, number, number, number]> = {
  selloff: [20, 75, 12, 80],
  quiet: [35, 35, 12, 80],
  broken: [20, 75, 12, 0],
};

const PRESET_LABELS: Record<PresetKey, string> = {
  selloff: "Sell-off",
  quiet: "Quiet",
  broken: "Broken claim",
};

const DETAILS: Record<
  DetailKey,
  { kicker: string; title: string; body: string; key: string; rule: string }
> = {
  transfer: {
    kicker: "A · TRANSFER",
    title: "A trade rearranges the holders.",
    body: "When one trader sells to another, cash moves from buyer to seller while the token changes hands. That may change the quoted price, but it does not create productive value for the holder group as a whole.",
    key: "TRACE",
    rule: "Ask whether the money came from a buyer—or from an asset or business.",
  },
  faucet: {
    kicker: "B · FAUCET",
    title: "External value has an independent source.",
    body: "Business profit, bond interest, rent, or protocol revenue can originate outside secondary token trading. Holders benefit only when the token's rights and payment route actually pass some of that value through.",
    key: "SOURCE",
    rule: "Name the producer, the payment, and the holder's right.",
  },
  sink: {
    kicker: "C · SINK",
    title: "Every route can leak.",
    body: "Operating losses, wrapper fees, custody costs, taxes, dilution, discretionary retention, and failed infrastructure can reduce what reaches holders. Selling can pressure price, but it is not itself the sink in this flow model.",
    key: "NET",
    rule: "Start with gross value, then subtract every drain before holders.",
  },
  anchor: {
    kicker: "D · ANCHOR",
    title: "A claim can matter without guaranteeing price.",
    body: "Enforceable distributions or redemption may attract bids when sentiment weakens. But a weak issuer, impaired asset, restricted exit, or thin market can pull price far from modeled value—and cash flow never makes an asset risk-free.",
    key: "PROVE",
    rule: "Rights, backing, and redemption turn a story into a claim.",
  },
};

const CARDS: { key: DetailKey; index: string; title: string; text: string; hint: string }[] = [
  { key: "transfer", index: "A · TRANSFER", title: "A sell moves ownership.", text: "The buyer funds the seller.", hint: "Not new value." },
  { key: "faucet", index: "B · FAUCET", title: "Value enters from outside.", text: "Earnings, interest, fees.", hint: "Trace the source." },
  { key: "sink", index: "C · SINK", title: "Value leaves the holder loop.", text: "Costs, dilution, leakage.", hint: "Find the drain." },
  { key: "anchor", index: "D · ANCHOR", title: "A claim can support a bid.", text: "Only if it can be enforced.", hint: "Test the bridge." },
];

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "What enters from outside trading?",
    a: "Look for operating earnings, interest, protocol fees, rent, or another independently produced cash source—not a future buyer.",
  },
  {
    q: "Who can claim that value?",
    a: "A reference price is not enough. Check the holder's legal or protocol right to dividends, distributions, buybacks, or redemption.",
  },
  {
    q: "How does cash reach holders?",
    a: "Map the route: producer → issuer or contract → eligible holder. Note timing, eligibility, custody, fees, and discretion.",
  },
  {
    q: "What can stop the route?",
    a: "Issuer failure, weak backing, transfer limits, paused redemption, smart-contract failure, dilution, or business losses can break the apparent anchor.",
  },
];

const CHOICES: { text: string; correct: boolean }[] = [
  { text: "The sell-off itself paid the remaining holders", correct: false },
  { text: "Market demand weakened; the separate cash-flow route still exists", correct: true },
  { text: "The token cannot fall further because it has cash flow", correct: false },
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
    date: "OCT 5, 2026",
    headline: "The corporate sink is still filling — slower.",
    body: [
      {
        lead: "What happened.",
        text: "DeFi Development Corp, the Nasdaq-listed company stacking SOL as its treasury asset, added 26,203 SOL — about $3 million — in the week ending October 2. Total: roughly 2.56 million SOL, valued near $302 million.",
      },
      {
        lead: "The pace is the story.",
        text: "101,381 SOL the week ending September 18, then 47,706, then 26,203. The sink is still open, but the inflow has roughly quartered in three weeks.",
      },
      {
        lead: "Why it belongs here.",
        text: "Sinks have rates, not just states. A buyer soaking up float at full speed props up the bid; the same buyer at quarter speed is a different market force. When a faucet-and-sink reader sees a treasury buyer, the next question is always: at what rate, and for how long?",
      },
      {
        lead: "The other side.",
        text: "The company frames it as an 11% treasury gain since August 12 and runs its own validators to compound the stack. Both can be true: the pile is bigger than in August, and the weekly additions are shrinking.",
      },
    ],
    sources:
      "Sources: Decrypt, Oct 5, 2026 (company 8-K filing); FXCrypto24, Oct 6, 2026. Holdings and pace as disclosed; \u201cSOL equivalents\u201d left undefined in the filing.",
  },
];

function moneyK(n: number, dec?: number): string {
  return (n < 0 ? "−$" : "$") + Math.abs(n).toFixed(dec ?? 0) + "K";
}

function signedK(n: number): string {
  return (n >= 0 ? "+$" : "−$") + Math.abs(n).toFixed(0) + "K";
}

function fillWidth(value: number, max: number): string {
  return Math.max(0, Math.min(100, (value / max) * 100)) + "%";
}

export default function SinksAndFaucetsPage() {
  const [buyers, setBuyers] = useState(20);
  const [sellers, setSellers] = useState(75);
  const [cashflow, setCashflow] = useState(12);
  const [passPct, setPassPct] = useState(80);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("selloff");
  const [detailKey, setDetailKey] = useState<DetailKey | null>(null);
  const [openCards, setOpenCards] = useState<DetailKey[]>([]);
  const [openQuestions, setOpenQuestions] = useState<boolean[]>([false, false, false, false]);
  const [picked, setPicked] = useState<number | null>(null);
  const [openNews, setOpenNews] = useState<number[]>([]);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    document.title = "Sinks and Faucets";
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (detailKey) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [detailKey]);

  const onSlider =
    (setter: (v: number) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void => {
      setter(Number(e.target.value));
      setActivePreset(null);
    };

  const applyPreset = (key: PresetKey): void => {
    const v = PRESETS[key];
    setBuyers(v[0]);
    setSellers(v[1]);
    setCashflow(v[2]);
    setPassPct(v[3]);
    setActivePreset(key);
  };

  const toggleCard =
    (key: DetailKey) =>
    (e: MouseEvent<HTMLElement>): void => {
      if ((e.target as HTMLElement).closest("button")) return;
      setOpenCards((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    };

  const openDetail =
    (key: DetailKey) =>
    (e: MouseEvent<HTMLButtonElement>): void => {
      e.stopPropagation();
      setDetailKey(key);
    };

  const closeDialog = (): void => setDetailKey(null);

  const toggleQuestion = (i: number): void => {
    setOpenQuestions((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const p = passPct / 100;
  const dist = cashflow * p;
  const cost = cashflow - dist;
  const net = buyers - sellers;
  const totalPositive = buyers + dist;
  const external = totalPositive > 0 ? (dist / totalPositive) * 100 : 0;

  const memeState =
    net < 0
      ? "Exit demand outruns modeled bids."
      : net > 0
        ? "Buyer demand is expanding the loop."
        : "Buyer demand exactly matches exits.";
  const claimState =
    dist <= 0
      ? "No cash reaches holders in this setup."
      : net < 0
        ? "Trading is weak; the claim still passes cash."
        : "Demand and productive cash both flow in.";
  const labNote =
    dist > 0
      ? "Both prices can fall. Only one lane has modeled cash entering from outside trading."
      : "With no enforceable pass-through, the second lane loses its modeled external faucet.";

  const detail = detailKey ? DETAILS[detailKey] : null;

  const feedback =
    picked === null
      ? "Separate the market from the claim."
      : CHOICES[picked].correct
        ? "Exactly. Price discovery and productive cash flow are different rails."
        : "The sell changes market pressure. It does not create the underlying distribution.";

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles.eyebrow}>
            <i />
            <span>FIELD GUIDE 07 · SINKS &amp; FAUCETS</span>
          </div>
          <h1 id="hero-title">A sell is not a faucet.</h1>
          <p>The difference is where value enters the system.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles.cta} href="#lab">
              Trace the money{" "}
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
            <span className={styles["hero-note"]}>Final node · no stakes</span>
          </div>
        </div>
        <div
          className={styles["flow-machine"]}
          aria-label="Two value sources flowing toward holders, with fees leaving through a drain"
        >
          <div className={styles["machine-board"]}>
            <div className={styles["board-grid"]} />
            <div className={`${styles.source} ${styles["source-market"]}`}>
              <b>Market demand</b>
              <small>TRADERS ↔ TRADERS</small>
            </div>
            <div className={`${styles.source} ${styles["source-cash"]}`}>
              <b>Productive cash</b>
              <small>BUSINESS → CLAIM</small>
            </div>
            <div className={`${styles.pipe} ${styles["pipe-market"]}`}>
              <i className={styles.stream} />
            </div>
            <div className={`${styles.pipe} ${styles["pipe-cash"]}`}>
              <i className={styles.stream} />
            </div>
            <div className={styles["holder-vat"]}>
              <i className={styles["vat-fill"]} />
            </div>
            <div className={styles.drain} />
          </div>
          <div className={styles["sell-chip"]}>SELL ≠ PAYOUT</div>
          <div className={styles["truth-chip"]}>
            <b>Find the source.</b>
            <small>THEN PRICE THE CLAIM.</small>
          </div>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / RUN BOTH MARKETS</div>
          <div>
            <h2 id="lab-title">Same sell-off. Different fuel.</h2>
            <p>Watch market demand and productive cash travel on separate rails.</p>
          </div>
        </div>
        <div className={styles.lab}>
          <div className={styles["lab-bar"]}>
            <div className={styles["lab-id"]}>
              <span className={styles["lab-icon"]}>↕</span>
              <div>
                <strong>One-cycle flow model</strong>
                <small>memecoin vs. tokenized cash-flow claim</small>
              </div>
            </div>
            <span className={styles["lab-tag"]}>ILLUSTRATIVE · NOT LIVE</span>
          </div>
          <div className={styles["lab-grid"]}>
            <div className={styles.stage}>
              <div className={styles.scoreboard} aria-live="polite">
                <div className={styles.score}>
                  <span>Trading pressure</span>
                  <strong className={net >= 0 ? styles.good : styles.bad}>{signedK(net)}</strong>
                </div>
                <div className={styles.score}>
                  <span>Claim distribution</span>
                  <strong className={dist > 0 ? styles.good : styles.bad}>{moneyK(dist, 1)}</strong>
                </div>
                <div className={styles.score}>
                  <span>External-value share</span>
                  <strong className={external > 0 ? styles.good : styles.bad}>
                    {Math.round(external)}%
                  </strong>
                </div>
              </div>
              <div className={styles.lanes}>
                <article className={`${styles.lane} ${styles.meme}`}>
                  <div className={styles["lane-top"]}>
                    <b>Memecoin</b>
                    <span>DEMAND-LED</span>
                  </div>
                  <div className={styles["flow-stack"]}>
                    <div className={styles["flow-row"]}>
                      <label>Buyers</label>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: fillWidth(buyers, 150) }} />
                      </div>
                    </div>
                    <div className={styles["flow-row"]}>
                      <label>Sellers</label>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: fillWidth(sellers, 150) }} />
                      </div>
                    </div>
                    <div className={styles["flow-row"]}>
                      <label>Productive cash</label>
                      <div className={styles.track}>
                        <div className={`${styles.fill} ${styles.cash} ${styles.empty}`} />
                      </div>
                    </div>
                  </div>
                  <div className={styles["lane-result"]}>
                    <span>Outside holder cash</span>
                    <strong>$0</strong>
                    <small>{memeState}</small>
                  </div>
                </article>
                <article className={`${styles.lane} ${styles.stock}`}>
                  <div className={styles["lane-top"]}>
                    <b>Tokenized claim</b>
                    <span>CASHFLOW + DEMAND</span>
                  </div>
                  <div className={styles["flow-stack"]}>
                    <div className={styles["flow-row"]}>
                      <label>Buyers</label>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: fillWidth(buyers, 150) }} />
                      </div>
                    </div>
                    <div className={styles["flow-row"]}>
                      <label>Sellers</label>
                      <div className={styles.track}>
                        <div className={styles.fill} style={{ width: fillWidth(sellers, 150) }} />
                      </div>
                    </div>
                    <div className={styles["flow-row"]}>
                      <label>Distribution</label>
                      <div className={styles.track}>
                        <div
                          className={`${styles.fill} ${styles.cash}`}
                          style={{ width: fillWidth(dist, 30) }}
                        />
                      </div>
                    </div>
                    <div className={styles["flow-row"]}>
                      <label>Costs</label>
                      <div className={styles.track}>
                        <div
                          className={`${styles.fill} ${styles.cost}`}
                          style={{ width: fillWidth(cost, 30) }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles["lane-result"]}>
                    <span>Outside holder cash</span>
                    <strong>{moneyK(dist, 1)}</strong>
                    <small>{claimState}</small>
                  </div>
                </article>
              </div>
            </div>
            <div className={styles.controls}>
              <div className={styles["preset-tabs"]} role="group" aria-label="Flow scenarios">
                {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={activePreset === key ? styles.active : undefined}
                    onClick={() => applyPreset(key)}
                  >
                    {PRESET_LABELS[key]}
                  </button>
                ))}
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="buyers">Buyer demand</label>
                  <output>{moneyK(buyers)}</output>
                </div>
                <p>Fresh market bids this cycle.</p>
                <input
                  id="buyers"
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={buyers}
                  onChange={onSlider(setBuyers)}
                />
                <div className={styles["range-ends"]}>
                  <span>$0</span>
                  <span>$150K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="sellers">Seller exits</label>
                  <output>{moneyK(sellers)}</output>
                </div>
                <p>Notional value offered for sale.</p>
                <input
                  id="sellers"
                  type="range"
                  min="0"
                  max="150"
                  step="5"
                  value={sellers}
                  onChange={onSlider(setSellers)}
                />
                <div className={styles["range-ends"]}>
                  <span>$0</span>
                  <span>$150K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="cashflow">Underlying cash</label>
                  <output>{moneyK(cashflow)}</output>
                </div>
                <p>Value produced outside token trading.</p>
                <input
                  id="cashflow"
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={cashflow}
                  onChange={onSlider(setCashflow)}
                />
                <div className={styles["range-ends"]}>
                  <span>$0</span>
                  <span>$30K</span>
                </div>
              </div>
              <div className={styles.control}>
                <div className={styles["control-top"]}>
                  <label htmlFor="pass">Holder pass-through</label>
                  <output>{Math.round(p * 100)}%</output>
                </div>
                <p>Cash that legally and operationally reaches holders.</p>
                <input
                  id="pass"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={passPct}
                  onChange={onSlider(setPassPct)}
                />
                <div className={styles["range-ends"]}>
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className={styles["impact-box"]}>
                <div className={styles["impact-row"]}>
                  <span>Buyer cash less exits</span>
                  <strong>{signedK(net)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Cash reaching holders</span>
                  <strong>{moneyK(dist, 1)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Wrapper / retained cash</span>
                  <strong>{moneyK(cost, 1)}</strong>
                </div>
                <p>{labNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.lens} aria-labelledby="lens-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>02 / NAME THE FLOWS</div>
          <div>
            <h2 id="lens-title">Four labels. No hand-waving.</h2>
            <p>Tap a card, then open the deeper layer.</p>
          </div>
        </div>
        <div className={styles.cards}>
          {CARDS.map((card) => (
            <article
              key={card.key}
              className={`${styles.card} ${openCards.includes(card.key) ? styles.open : ""}`}
              tabIndex={0}
              onClick={toggleCard(card.key)}
            >
              <span className={styles["card-index"]}>{card.index}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className={styles.reveal}>
                <span>{card.hint}</span>
                <button className={styles["detail-btn"]} type="button" onClick={openDetail(card.key)}>
                  Open
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.diagnostic} aria-labelledby="diagnostic-title">
        <div className={styles["diagnostic-copy"]}>
          <div className={styles["section-no"]}>03 / TRACE ANY TOKEN</div>
          <h2 id="diagnostic-title">Ask where the money starts.</h2>
          <p>A ticker is not a business model. Open each question.</p>
        </div>
        <div className={styles["diagnostic-panel"]}>
          <div className={styles["question-list"]}>
            {QUESTIONS.map((item, i) => {
              const open = openQuestions[i];
              return (
                <div key={i}>
                  <button
                    className={`${styles.question} ${open ? styles.open : ""}`}
                    type="button"
                    aria-expanded={open}
                    onClick={() => toggleQuestion(i)}
                  >
                    <b>{i + 1}</b>
                    <span>{item.q}</span>
                    <i>+</i>
                  </button>
                  <div className={`${styles.answer} ${open ? styles.open : ""}`}>{item.a}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.checkpoint} aria-labelledby="check-title">
        <div className={styles["check-grid"]}>
          <div>
            <div className={styles["section-no"]}>04 / FINAL CHECKPOINT</div>
            <h2 id="check-title">Find the faucet</h2>
            <p>
              A token trades down 35%, while its underlying business still sends an enforceable cash
              distribution to holders. What changed?
            </p>
          </div>
          <div>
            <div className={styles.choices} role="group" aria-label="Quiz answers">
              {CHOICES.map((c, i) => (
                <button
                  key={i}
                  className={`${styles.choice} ${
                    picked === i ? (c.correct ? styles.correct : styles.wrong) : ""
                  }`}
                  type="button"
                  onClick={() => setPicked(i)}
                >
                  {c.text}
                </button>
              ))}
            </div>
            <div className={styles.feedback} aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.thisweek} aria-labelledby="thisweek-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>05 / THIS WEEK</div>
          <div>
            <h2 id="thisweek-title">A sink, with a pulse.</h2>
            <p>
              One real flow, measured weekly. Tap the date for the deeper
              layer.
            </p>
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

      <section className={styles.takeaway} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE ONE-LINER</div>
        <blockquote>
          A sell is a transfer. A faucet is external value. The claim decides whether holders can
          reach it.
        </blockquote>
      </section>
      <p className={styles.fine}>
        Simplified teaching model, not a price forecast or description of a specific tokenized-stock
        product. Tokenized equity exposure can be a direct claim, custodial receipt, derivative, or
        other wrapper; dividends, voting, redemption, transfer rules, insolvency treatment, and
        eligibility vary. Cash flow does not prevent losses, weak liquidity, business failure, or a
        race to the exit. Not investment advice.
      </p>

      <dialog
        ref={dialogRef}
        id="detailDialog"
        aria-labelledby="detailTitle"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeDialog();
        }}
        onClose={closeDialog}
      >
        <div className={styles["dialog-inner"]}>
          <div className={styles["dialog-top"]}>
            <div>
              <span className={styles["dialog-kicker"]}>{detail?.kicker ?? ""}</span>
              <h3 id="detailTitle">{detail?.title ?? ""}</h3>
            </div>
            <button
              className={styles.close}
              type="button"
              aria-label="Close detail"
              onClick={closeDialog}
            >
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
