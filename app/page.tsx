"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type NodeKey =
  | "core"
  | "pools"
  | "farming"
  | "looping"
  | "arbitrage"
  | "perps"
  | "rwa"
  | "flows";

interface NodeInfo {
  kicker: string;
  title: string;
  hook: string;
  shift: string;
  watch: string;
  href: string;
}

const NODES: Record<NodeKey, NodeInfo> = {
  core: {
    kicker: "YOUR STARTING POINT",
    title: "Solana memecoin trading",
    hook: "You already know attention, entries, exits, and velocity. The map reveals the machinery underneath.",
    shift: "From ticker movement to capital flow.",
    watch: "Who supplies liquidity—and who absorbs risk.",
    href: "#map",
  },
  pools: {
    kicker: "NODE 01 · MARKET STRUCTURE",
    title: "Liquidity Pools",
    hook: "A swap changes the reserve ratio. That is the price move.",
    shift: "From chart candles to pool inventory.",
    watch: "Depth, slippage, fees, impermanent loss.",
    href: "/liquidity-pools",
  },
  farming: {
    kicker: "NODE 02 · INCENTIVES",
    title: "Yield Farming",
    hook: "LP positions can earn twice: trading fees and token emissions.",
    shift: "From holding liquidity to renting it out.",
    watch: "Real fees versus subsidized yield.",
    href: "/yield-farming",
  },
  looping: {
    kicker: "NODE 03 · LEVERAGE",
    title: "Looping",
    hook: "Borrow against a deposit, redeposit, then repeat.",
    shift: "From one unit of capital to layered exposure.",
    watch: "LTV, borrow cost, liquidation distance.",
    href: "/looping",
  },
  arbitrage: {
    kicker: "NODE 04 · EXECUTION",
    title: "Cross-DEX Arbitrage",
    hook: "Fragmented pools disagree. Arbitrageurs race to close the gap.",
    shift: "From finding a price to routing a trade.",
    watch: "Fees, latency, price impact, failed execution.",
    href: "/cross-dex-arbitrage",
  },
  perps: {
    kicker: "NODE 05 · DERIVATIVES",
    title: "Perps & Futures",
    hook: "Trade directional exposure without owning the spot asset.",
    shift: "From inventory to contracts.",
    watch: "Funding, margin, leverage, liquidation.",
    href: "/perps-and-futures",
  },
  rwa: {
    kicker: "NODE 06 · CLAIMS",
    title: "Real-World Assets",
    hook: "An onchain token can point to value produced somewhere else.",
    shift: "From token price to holder rights.",
    watch: "Backing, custody, redemption, enforcement.",
    href: "/rwa",
  },
  flows: {
    kicker: "NODE 07 · SYSTEMS",
    title: "Sinks & Faucets",
    hook: "A sell transfers value. A real faucet adds value from outside trading.",
    shift: "From price pressure to value source.",
    watch: "Cash entering, cash leaking, claims reaching holders.",
    href: "/sinks-and-faucets",
  },
};

type NodeCardKey = Exclude<NodeKey, "core">;
type LensGroup = "market" | "leverage" | "value";
type Lens = "all" | LensGroup;

interface NodeCard {
  key: NodeCardKey;
  posClass: string;
  group: LensGroup;
  num: string;
  role: string;
  title: string;
  blurb: string;
}

const NODE_CARDS: NodeCard[] = [
  { key: "pools", posClass: "n1", group: "market", num: "01", role: "MARKET STRUCTURE", title: "Liquidity Pools", blurb: "Where every swap begins." },
  { key: "farming", posClass: "n2", group: "market", num: "02", role: "INCENTIVES", title: "Yield Farming", blurb: "Put LP positions to work." },
  { key: "looping", posClass: "n3", group: "leverage", num: "03", role: "LEVERAGE", title: "Looping", blurb: "Deposit. Borrow. Repeat." },
  { key: "arbitrage", posClass: "n4", group: "market", num: "04", role: "EXECUTION", title: "Cross-DEX Arbitrage", blurb: "Price gaps become a race." },
  { key: "perps", posClass: "n5", group: "leverage", num: "05", role: "DERIVATIVES", title: "Perps & Futures", blurb: "Trade the move, not the coin." },
  { key: "rwa", posClass: "n6", group: "value", num: "06", role: "CLAIMS", title: "RWA", blurb: "Offchain value, onchain rails." },
  { key: "flows", posClass: "n7", group: "value", num: "07", role: "SYSTEMS", title: "Sinks & Faucets", blurb: "Trace where value enters." },
];

const LENSES: Array<{ key: Lens; label: string }> = [
  { key: "all", label: "All nodes" },
  { key: "market", label: "Markets" },
  { key: "leverage", label: "Leverage" },
  { key: "value", label: "Value" },
];

const ROUTE_STEPS = ["Structure", "Incentives", "Leverage", "Execution", "Derivatives", "Claims", "Flows"];

const FLOW_STEPS: Array<{ key: NodeCardKey; verb: string; sub: string }> = [
  { key: "pools", verb: "Swap", sub: " → pools make the market" },
  { key: "farming", verb: "Supply", sub: " → LP positions earn" },
  { key: "looping", verb: "Borrow", sub: " → exposure compounds" },
  { key: "arbitrage", verb: "Route", sub: " → price gaps close" },
  { key: "perps", verb: "Hedge", sub: " → funding ties contracts to spot" },
  { key: "rwa", verb: "Tokenize", sub: " → claims cross onchain" },
  { key: "flows", verb: "Trace", sub: " → value gets a source and a drain" },
];

export default function HubMap() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [openKey, setOpenKey] = useState<NodeKey | null>(null);
  const [lens, setLens] = useState<Lens>("all");

  useEffect(() => {
    document.title = "Hub Map";
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openKey && !dialog.open) {
      dialog.showModal();
    } else if (!openKey && dialog.open) {
      dialog.close();
    }
  }, [openKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const syncClosed = () => setOpenKey(null);
    dialog.addEventListener("close", syncClosed);
    return () => dialog.removeEventListener("close", syncClosed);
  }, []);

  const closeDialog = () => setOpenKey(null);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) closeDialog();
  };

  const active: NodeInfo | null = openKey ? NODES[openKey] : null;

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles["hero-copy"]}>
          <div className={styles.eyebrow}>
            <i />
            <span>THE ECOSYSTEM · ONE CONNECTED MAP</span>
          </div>
          <h1 id="hero-title">Seven routes out of the memecoin loop.</h1>
          <p>Start with the swap. Follow the capital.</p>
          <div className={styles["hero-actions"]}>
            <a className={styles.cta} href="#map">
              Enter the map{" "}
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
            <span className={styles["hero-note"]}>7 field guides · one system</span>
          </div>
        </div>
        <div className={styles.radar} aria-label="Animated radar with seven learning nodes around Solana memecoin trading">
          <div className={styles["radar-board"]}>
            <i className={styles.sweep} />
            <div className={styles["core-disc"]}>
              <div>
                <b>
                  SOLANA
                  <br />
                  MEMECOINS
                </b>
                <small>YOUR STARTING POINT</small>
              </div>
            </div>
          </div>
          <i className={`${styles["radar-dot"]} ${styles.d1}`}>01</i>
          <i className={`${styles["radar-dot"]} ${styles.d2}`}>02</i>
          <i className={`${styles["radar-dot"]} ${styles.d3}`}>03</i>
          <i className={`${styles["radar-dot"]} ${styles.d4}`}>04</i>
          <i className={`${styles["radar-dot"]} ${styles.d5}`}>05</i>
          <i className={`${styles["radar-dot"]} ${styles.d6}`}>06</i>
          <i className={`${styles["radar-dot"]} ${styles.d7}`}>07</i>
          <div className={styles["radar-card"]}>
            <b>Touch a node.</b>
            <span>OPEN THE DEEPER LAYER</span>
          </div>
        </div>
      </section>

      <section className={styles["map-section"]} id="map" aria-labelledby="map-title">
        <div className={styles["section-head"]}>
          <div className={styles["section-no"]}>01 / ORIENT</div>
          <div>
            <h2 id="map-title">The whole field, at once.</h2>
            <p>Tap a node. Or isolate a lens.</p>
          </div>
        </div>
        <div className={styles["map-shell"]}>
          <div className={styles["map-toolbar"]}>
            <div className={styles["map-id"]}>
              <i className={styles.pulse} />
              <div>
                <b>Capital system</b>
                <small>interactive learning map</small>
              </div>
            </div>
            <div className={styles.lenses} role="group" aria-label="Filter learning nodes">
              {LENSES.map((l) => (
                <button
                  key={l.key}
                  className={lens === l.key ? `${styles.lens} ${styles.active}` : styles.lens}
                  type="button"
                  onClick={() => setLens(l.key)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles["map-board"]} id="mapBoard" data-lens={lens}>
            <svg className={styles.connections} viewBox="0 0 1000 690" preserveAspectRatio="none" aria-hidden="true">
              <line className={styles.market} x1="500" y1="345" x2="145" y2="112" />
              <line className={styles.market} x1="500" y1="345" x2="120" y2="330" />
              <line className={styles.leverage} x1="500" y1="345" x2="190" y2="598" />
              <line className={styles.market} x1="500" y1="345" x2="855" y2="112" />
              <line className={styles.leverage} x1="500" y1="345" x2="880" y2="330" />
              <line className={styles.value} x1="500" y1="345" x2="810" y2="598" />
              <line className={styles.value} x1="500" y1="345" x2="500" y2="65" />
              <circle cx="500" cy="345" r="5" />
            </svg>
            <button className={styles.core} type="button" onClick={() => setOpenKey("core")}>
              <span>
                <small>THE CENTER</small>
                <b>Solana memecoin trading</b>
                <em>Price, flow, attention</em>
              </span>
            </button>
            {NODE_CARDS.map((n) => (
              <button
                key={n.key}
                className={`${styles.node} ${styles[n.posClass]}`}
                type="button"
                data-group={n.group}
                onClick={() => setOpenKey(n.key)}
              >
                <span className={styles["node-top"]}>
                  <span className={styles["node-num"]}>{n.num}</span>
                  <span className={styles["node-role"]}>{n.role}</span>
                </span>
                <b>{n.title}</b>
                <small>{n.blurb}</small>
              </button>
            ))}
          </div>
          <div className={styles["route-strip"]} aria-label="Suggested learning order">
            {ROUTE_STEPS.map((label, i) => (
              <div key={label} className={styles["route-step"]}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{label}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles["path-section"]} aria-labelledby="path-title">
        <div className={styles["path-grid"]}>
          <div className={styles["path-copy"]}>
            <div className={styles["section-no"]}>02 / FOLLOW THE PATH</div>
            <h2 id="path-title">One move unlocks the next.</h2>
            <p>The sequence follows what capital does—not a textbook.</p>
          </div>
          <div className={styles["path-flow"]}>
            <div className={styles["flow-list"]}>
              {FLOW_STEPS.map((f, i) => (
                <button
                  key={f.key}
                  className={styles["flow-button"]}
                  type="button"
                  onClick={() => setOpenKey(f.key)}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{f.verb}</b>
                    <small>{f.sub}</small>
                  </div>
                  <i>↗</i>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles["one-liner"]} aria-label="Core takeaway">
        <div className={styles["section-no"]}>THE MAP IN ONE LINE</div>
        <blockquote>Memecoin trading is the front door. Market structure, leverage, and cash flows are the building.</blockquote>
      </section>
      <p className={styles.fine}>
        These field guides use simplified teaching models, not live market data or investment advice. Token mechanics, legal
        rights, liquidity, fees, and risk vary by protocol and product.
      </p>

      <dialog
        ref={dialogRef}
        id="nodeDialog"
        aria-labelledby="dialogTitle"
        onClick={handleBackdropClick}
      >
        {active && openKey && (
          <div className={styles["dialog-inner"]}>
            <div className={styles["dialog-top"]}>
              <div>
                <span className={styles["dialog-kicker"]} id="dialogKicker">
                  {active.kicker}
                </span>
                <h3 id="dialogTitle">{active.title}</h3>
              </div>
              <button className={styles.close} type="button" aria-label="Close detail" onClick={closeDialog}>
                ×
              </button>
            </div>
            <p className={styles["dialog-hook"]} id="dialogHook">
              {active.hook}
            </p>
            <div className={styles["dialog-grid"]}>
              <div className={styles["dialog-cell"]}>
                <span>THE SHIFT</span>
                <b id="dialogShift">{active.shift}</b>
              </div>
              <div className={styles["dialog-cell"]}>
                <span>WATCH FOR</span>
                <b id="dialogWatch">{active.watch}</b>
              </div>
            </div>
            {openKey === "core" ? (
              <a className={styles["dialog-link"]} href="#map" onClick={closeDialog}>
                <b>See the map</b>
                <span>START HERE ↓</span>
              </a>
            ) : (
              <Link className={styles["dialog-link"]} href={active.href} onClick={closeDialog}>
                <b>Open field guide</b>
                <span>INTERACTIVE NODE ↗</span>
              </Link>
            )}
          </div>
        )}
      </dialog>
    </main>
  );
}
