"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import styles from "./page.module.css";

const UNITS = 10000;

function cash(n: number, d: number): string {
  return (
    (n < 0 ? "−$" : "$") +
    Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    })
  );
}

function signedPct(n: number, d: number): string {
  return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toFixed(d) + "%";
}

type ScenarioKey = "normal" | "pause" | "loss";

interface ScenarioLink {
  pct: number;
  label: string;
}

interface Scenario {
  transfer: ScenarioLink;
  backing: ScenarioLink;
  redeem: ScenarioLink;
  lead: string;
  text: string;
}

const scenarioLabels: Record<ScenarioKey, string> = {
  normal: "Normal",
  pause: "Redemption pause",
  loss: "Asset loss",
};

const scenarios: Record<ScenarioKey, Scenario> = {
  normal: {
    transfer: { pct: 100, label: "OPEN" },
    backing: { pct: 100, label: "100%" },
    redeem: { pct: 100, label: "OPEN" },
    lead: "All three links are operating.",
    text: "The token can trade, the asset remains backed, and the issuer honors the exit path.",
  },
  pause: {
    transfer: { pct: 100, label: "OPEN" },
    backing: { pct: 100, label: "100%" },
    redeem: { pct: 8, label: "PAUSED" },
    lead: "The chain is still live.",
    text: "Secondary trading may continue even while holders cannot convert tokens back through the issuer.",
  },
  loss: {
    transfer: { pct: 100, label: "OPEN" },
    backing: { pct: 72, label: "72%" },
    redeem: { pct: 72, label: "IMPAIRED" },
    lead: "The wrapper cannot erase asset loss.",
    text: "Tokens may keep moving, but a weaker pool can mean a weaker claim and lower redemption value.",
  },
};

type DetailKey = "rights" | "reserves" | "redemption";

interface Detail {
  kicker: string;
  title: string;
  body: string;
  key: string;
  rule: string;
}

const details: Record<DetailKey, Detail> = {
  rights: {
    kicker: "A · RIGHTS",
    title: "The token is not automatically the asset.",
    body: "One token may represent a direct beneficial interest. Another may provide only price exposure or a claim against an issuer. Governance, income, voting rights, transfer restrictions, and insolvency treatment come from the legal structure—not the ticker.",
    key: "ASK",
    rule: "What exactly can the holder enforce?",
  },
  reserves: {
    kicker: "B · RESERVES",
    title: "Backing needs a place and a witness.",
    body: "The underlying asset may sit with a bank, broker, custodian, trustee, or special-purpose vehicle. Attestations, audits, and transparent records can reduce uncertainty, but each is different evidence with different limits.",
    key: "TRACE",
    rule: "Token supply should reconcile with eligible backing.",
  },
  redemption: {
    kicker: "C · REDEMPTION",
    title: "Trading out and redeeming are different exits.",
    body: "A secondary buyer gives market liquidity. Redemption converts the claim through the issuer or vehicle, often with eligibility checks, windows, minimums, fees, or settlement delays. If redemption weakens, market price can detach from reported NAV.",
    key: "EXIT",
    rule: "Know who returns value, on what terms, and when.",
  },
};

interface Card {
  index: string;
  title: string;
  text: string;
  reveal: string;
  detail: DetailKey;
}

const cards: Card[] = [
  {
    index: "A · RIGHTS",
    title: "What does the token promise?",
    text: "Ownership, exposure, income—or less.",
    reveal: "Read the contract.",
    detail: "rights",
  },
  {
    index: "B · RESERVES",
    title: "Where does the asset sit?",
    text: "Custody leaves the chain.",
    reveal: "Verify the backing.",
    detail: "reserves",
  },
  {
    index: "C · REDEMPTION",
    title: "How does value come back?",
    text: "A market exit is not a redemption.",
    reveal: "Find the exit.",
    detail: "redemption",
  },
];

interface QuizChoice {
  label: string;
  answer: "correct" | "wrong";
}

const quizChoices: QuizChoice[] = [
  { label: "Yes—NAV guarantees the market price", answer: "wrong" },
  {
    label: "No—rights, liquidity, and redemption still matter",
    answer: "correct",
  },
  { label: "Yes—every RWA token can redeem instantly", answer: "wrong" },
];

function fillStyle(pct: number): CSSProperties {
  return {
    width: pct + "%",
    background:
      pct < 30 ? "var(--red)" : pct < 90 ? "var(--gold)" : "var(--mint)",
  };
}

export default function RwaPage() {
  const [assetValue, setAssetValue] = useState(100000);
  const [grossYield, setGrossYield] = useState(4.5);
  const [fee, setFee] = useState(0.3);
  const [premium, setPremium] = useState(-2);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("normal");
  const [openCards, setOpenCards] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [detailKey, setDetailKey] = useState<DetailKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.title = "Real-World Assets";
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && detailKey && !d.open) {
      d.showModal();
    }
  }, [detailKey]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => setDetailKey(null);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const value = assetValue;
  const gross = grossYield / 100;
  const cost = fee / 100;
  const prem = premium / 100;
  const nav = value / UNITS;
  const netRate = gross - cost;
  const netIncome = value * netRate;
  const market = nav * (1 + prem);
  const perToken = netIncome / UNITS;
  const implied = market > 0 ? (perToken / market) * 100 : 0;
  const pass = gross > 0 ? Math.max(0, (netRate / gross) * 100) : 0;
  const labNote =
    prem < 0
      ? "A discount raises the yield implied by the market quote—but only if the income and redemption claim hold."
      : prem > 0
        ? "A premium lowers the yield implied by the market quote. Convenience and liquidity can still carry a price."
        : "At NAV, the implied yield matches the modeled net asset yield.";

  const scenario = scenarios[scenarioKey];
  const detail = detailKey ? details[detailKey] : null;

  const toggleCard = (i: number) =>
    setOpenCards((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );

  const handleBackdrop = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  const feedback =
    picked === null
      ? "A number is only as strong as the path back to value."
      : quizChoices[picked].answer === "correct"
        ? "Exactly. The discount may price delay, restrictions, risk, or thin liquidity."
        : "Check what the token legally promises—and whether you can actually redeem it.";

  const statusRows = [
    { name: "Token transfer", link: scenario.transfer },
    { name: "Asset backing", link: scenario.backing },
    { name: "Redemption", link: scenario.redeem },
  ];

  return (
    <main className={styles["page"]}>
      <section className={styles["hero"]} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles["eyebrow"]}>
            <i></i>
            <span>FIELD GUIDE 06 · REAL-WORLD ASSETS</span>
          </div>
          <h1 id="hero-title">Onchain token. Offchain promise.</h1>
          <p>The chain moves the claim. The real world has to honor it.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles["cta"]} href="#lab">
              Follow the claim{" "}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
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
          className={styles["bridge-machine"]}
          aria-label="A paper asset certificate linked to an onchain token"
        >
          <div className={styles["paper-cert"]}>
            <span className={styles["cert-kicker"]}>OFFCHAIN ASSET RECORD</span>
            <div className={styles["cert-title"]}>Short-term Treasury</div>
            <div className={styles["cert-value"]}>$100,000</div>
            <div className={styles["cert-lines"]}>
              <i></i>
              <i></i>
              <i></i>
            </div>
            <div className={styles["seal"]}>HELD</div>
          </div>
          <div className={styles["bridge-link"]} aria-hidden="true"></div>
          <div className={styles["bridge-tag"]}>LEGAL BRIDGE</div>
          <div className={styles["token-card"]}>
            <div className={styles["token-grid"]}></div>
            <div className={styles["token-copy"]}>
              <span>ONCHAIN CLAIM</span>
              <b>10,000</b>
              <small>transferable units</small>
            </div>
          </div>
        </div>
      </section>

      <section id="lab" aria-labelledby="lab-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / WRAP THE ASSET</div>
          <div>
            <h2 id="lab-title">The yield starts elsewhere.</h2>
            <p>
              Model a tokenized Treasury-like product. Every input is
              illustrative.
            </p>
          </div>
        </div>
        <div className={styles["lab"]}>
          <div className={styles["lab-bar"]}>
            <div className={styles["asset-id"]}>
              <span className={styles["asset-icon"]}>T</span>
              <div>
                <strong>Tokenized Treasury model</strong>
                <small>10,000 units backed by one offchain pool</small>
              </div>
            </div>
            <span className={styles["lab-tag"]}>ILLUSTRATIVE · NOT LIVE</span>
          </div>
          <div className={styles["lab-grid"]}>
            <div className={styles["stage"]}>
              <div className={styles["scoreboard"]} aria-live="polite">
                <div className={styles["score"]}>
                  <span>NAV per token</span>
                  <strong>{cash(nav, 2)}</strong>
                </div>
                <div className={styles["score"]}>
                  <span>Market token price</span>
                  <strong>{cash(market, 2)}</strong>
                </div>
                <div className={styles["score"]}>
                  <span>Implied net yield</span>
                  <strong
                    className={
                      netRate >= 0 ? styles["good"] : styles["bad"]
                    }
                  >
                    {implied.toFixed(2)}%
                  </strong>
                </div>
              </div>
              <div className={styles["flow-stage"]}>
                <div className={styles["flow-row"]}>
                  <div className={styles["node"]}>
                    <span className={styles["node-mark"]}>$</span>
                    <b>Asset pool</b>
                    <span>{cash(value, 0)} held offchain</span>
                  </div>
                  <div className={styles["flow-arrow"]} aria-hidden="true">
                    <i className={styles["flow-packet"]}></i>
                  </div>
                  <div
                    className={`${styles["node"]} ${styles["token"]}`}
                  >
                    <span className={styles["node-mark"]}>T</span>
                    <b>Token claim</b>
                    <span>{cash(market, 2)} market quote</span>
                  </div>
                </div>
                <div className={styles["cash-strip"]}>
                  <div className={styles["cash-top"]}>
                    <div>
                      <span>Gross income → fees → holder economics</span>
                      <strong>
                        {cash(netIncome, 0)} net / year
                      </strong>
                    </div>
                    <strong>{pass.toFixed(1)}% passes through</strong>
                  </div>
                  <div className={styles["cash-track"]}>
                    <div
                      className={styles["cash-fill"]}
                      style={{ width: Math.min(100, pass) + "%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles["controls"]}>
              <div className={styles["control"]}>
                <div className={styles["control-top"]}>
                  <label htmlFor="assetValue">Asset pool</label>
                  <output>{cash(value, 0)}</output>
                </div>
                <p>Value recorded by the issuer or vehicle.</p>
                <input
                  id="assetValue"
                  type="range"
                  min={25000}
                  max={500000}
                  step={25000}
                  value={assetValue}
                  onChange={(e) => setAssetValue(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>$25K</span>
                  <span>$500K</span>
                </div>
              </div>
              <div className={styles["control"]}>
                <div className={styles["control-top"]}>
                  <label htmlFor="grossYield">Gross asset yield</label>
                  <output>{(gross * 100).toFixed(2)}%</output>
                </div>
                <p>Income produced before wrapper costs.</p>
                <input
                  id="grossYield"
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={grossYield}
                  onChange={(e) => setGrossYield(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>0%</span>
                  <span>10%</span>
                </div>
              </div>
              <div className={styles["control"]}>
                <div className={styles["control-top"]}>
                  <label htmlFor="fee">Issuer + service fee</label>
                  <output>{(cost * 100).toFixed(2)}%</output>
                </div>
                <p>Annual cost taken from asset value.</p>
                <input
                  id="fee"
                  type="range"
                  min={0}
                  max={3}
                  step={0.05}
                  value={fee}
                  onChange={(e) => setFee(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>0%</span>
                  <span>3%</span>
                </div>
              </div>
              <div className={styles["control"]}>
                <div className={styles["control-top"]}>
                  <label htmlFor="premium">Market vs. NAV</label>
                  <output>{signedPct(prem * 100, 1)}</output>
                </div>
                <p>Secondary quote can detach from redemption value.</p>
                <input
                  id="premium"
                  type="range"
                  min={-15}
                  max={15}
                  step={0.5}
                  value={premium}
                  onChange={(e) => setPremium(Number(e.target.value))}
                />
                <div className={styles["range-ends"]}>
                  <span>−15%</span>
                  <span>+15%</span>
                </div>
              </div>
              <div className={styles["impact-box"]}>
                <div className={styles["impact-row"]}>
                  <span>Gross asset income</span>
                  <strong>{cash(value * gross, 0)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Annual wrapper cost</span>
                  <strong>{"−" + cash(value * cost, 0)}</strong>
                </div>
                <div className={styles["impact-row"]}>
                  <span>Net income per token</span>
                  <strong>{cash(perToken, 2)}</strong>
                </div>
                <p>{labNote}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles["mechanics"]} aria-labelledby="mechanics-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>02 / OPEN THE WRAPPER</div>
          <div>
            <h2 id="mechanics-title">Three links make it real.</h2>
            <p>Tap a card. Inspect the bridge behind the token.</p>
          </div>
        </div>
        <div className={styles["cards"]}>
          {cards.map((card, i) => (
            <article
              key={card.detail}
              className={`${styles["card"]}${
                openCards.includes(i) ? ` ${styles["open"]}` : ""
              }`}
              tabIndex={0}
              onClick={() => toggleCard(i)}
            >
              <span className={styles["card-index"]}>{card.index}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className={styles["reveal"]}>
                <span>{card.reveal}</span>
                <button
                  className={styles["detail-btn"]}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailKey(card.detail);
                  }}
                >
                  Open detail
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles["stress"]} aria-labelledby="stress-title">
        <div className={styles["stress-copy"]}>
          <div className={styles["section-no"]}>03 / STRESS THE BRIDGE</div>
          <h2 id="stress-title">The token can move while the claim stalls.</h2>
          <p>Change the scenario. Watch which link carries the risk.</p>
        </div>
        <div className={styles["stress-panel"]}>
          <div
            className={styles["scenario-tabs"]}
            role="group"
            aria-label="Bridge scenarios"
          >
            {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={
                  scenarioKey === key ? styles["active"] : undefined
                }
                onClick={() => setScenarioKey(key)}
              >
                {scenarioLabels[key]}
              </button>
            ))}
          </div>
          <div className={styles["bridge-status"]}>
            {statusRows.map((row) => (
              <div className={styles["status-row"]} key={row.name}>
                <span>{row.name}</span>
                <div className={styles["status-track"]}>
                  <div
                    className={styles["status-fill"]}
                    style={fillStyle(row.link.pct)}
                  ></div>
                </div>
                <b>{row.link.label}</b>
              </div>
            ))}
          </div>
          <p className={styles["stress-note"]}>
            <b>{scenario.lead}</b> <span>{scenario.text}</span>
          </p>
        </div>
      </section>

      <section className={styles["checkpoint"]} aria-labelledby="check-title">
        <div className={styles["check-grid"]}>
          <div>
            <div className={styles["section-no"]}>04 / CHECKPOINT</div>
            <h2 id="check-title">Read the claim</h2>
            <p>
              An RWA token trades 8% below reported NAV. Is the discount
              automatically free money?
            </p>
          </div>
          <div>
            <div
              className={styles["choices"]}
              role="group"
              aria-label="Quiz answers"
            >
              {quizChoices.map((choice, i) => {
                const stateClass =
                  picked === i
                    ? choice.answer === "correct"
                      ? styles["correct"]
                      : styles["wrong"]
                    : "";
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${styles["choice"]}${
                      stateClass ? ` ${stateClass}` : ""
                    }`}
                    onClick={() => setPicked(i)}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
            <div className={styles["feedback"]} aria-live="polite">
              {feedback}
            </div>
          </div>
        </div>
      </section>

      <section className={styles["takeaway"]} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE ONE-LINER</div>
        <blockquote>
          An RWA token is a programmable claim. Its value depends on rights,
          reserves, and redemption.
        </blockquote>
      </section>
      <p className={styles["fine"]}>
        Simplified teaching model, not a live product or market quote.
        “RWA” covers many structures: direct claims, fund interests, debt,
        custodial receipts, and synthetic exposure. Legal rights, investor
        eligibility, transfer limits, pricing, custody, income distribution,
        and redemption differ by issuer and jurisdiction. Not investment
        advice.
      </p>

      <dialog
        ref={dialogRef}
        onClick={handleBackdrop}
        aria-labelledby="detailTitle"
      >
        <div className={styles["dialog-inner"]}>
          <div className={styles["dialog-top"]}>
            <div>
              <span className={styles["dialog-kicker"]}>
                {detail?.kicker}
              </span>
              <h3 id="detailTitle">{detail?.title}</h3>
            </div>
            <button
              className={styles["close"]}
              type="button"
              aria-label="Close detail"
              onClick={() => dialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <p className={styles["dialog-body"]}>{detail?.body}</p>
          <div className={styles["dialog-rule"]}>
            <b>{detail?.key}</b>
            <span>{detail?.rule}</span>
          </div>
        </div>
      </dialog>
    </main>
  );
}
