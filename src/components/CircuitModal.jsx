import React, { useState, useRef, useCallback } from "react";
import Boolforge from "../pages/Boolforge";

/* ─────────────────────────────────────────────────────────────────
   CircuitModal
   Props:
     open        – boolean, whether the modal is visible
     onClose     – () => void
     problem     – full problem object from ProblemsData (optional)
                   { title, inputs, outputs, truthTable, equations, … }
     expression  – string expression (used when no problem supplied)
     variables   – string[] (used when no problem supplied)
   ───────────────────────────────────────────────────────────────── */

// ── Utility: generate all binary combinations for N inputs ────────
function generateInputCombinations(inputNames) {
  const n = inputNames.length;
  const rows = [];
  for (let i = 0; i < Math.pow(2, n); i++) {
    const row = {};
    for (let j = 0; j < n; j++) {
      row[inputNames[j]] = (i >> (n - 1 - j)) & 1;
    }
    rows.push(row);
  }
  return rows;
}

// ── Utility: evaluate a circuit for one input assignment ──────────
function evaluateCircuit(gates, wires, inputAssignment) {
  const gateMap = new Map(gates.map((g) => [g.id, g]));

  // Inject input values from the assignment
  const gatesWithValues = gates.map((g) => {
    if (g.type === "INPUT") {
      const varName = g.label || g.name;
      const val = inputAssignment[varName];
      return { ...g, inputValues: [val !== undefined ? Boolean(val) : false] };
    }
    return g;
  });
  const injectedMap = new Map(gatesWithValues.map((g) => [g.id, g]));

  const memo = new Map();

  function evalGate(gateId, depth = 0) {
    if (depth > 150) return false;
    if (memo.has(gateId)) return memo.get(gateId);

    const gate = injectedMap.get(gateId);
    if (!gate) return false;

    if (gate.type === "INPUT") {
      const v = gate.inputValues?.[0] ?? false;
      memo.set(gateId, v);
      return v;
    }

    const inputs = [];
    wires.forEach((wire) => {
      if (wire.toId === gateId) {
        inputs[wire.toIndex] = evalGate(wire.fromId, depth + 1);
      }
    });

    const ci = inputs.filter((v) => v !== undefined);
    let result = false;
    switch (gate.type) {
      case "AND":
        result = ci.length > 0 && ci.every(Boolean);
        break;
      case "OR":
        result = ci.some(Boolean);
        break;
      case "NOT":
        result = !inputs[0];
        break;
      case "NAND":
        result = !(ci.length > 0 && ci.every(Boolean));
        break;
      case "NOR":
        result = !ci.some(Boolean);
        break;
      case "XOR":
        result = inputs.length === 2 && inputs[0] !== inputs[1];
        break;
      case "XNOR":
        result = inputs.length === 2 && inputs[0] === inputs[1];
        break;
      case "BUFFER":
      case "OUTPUT":
        result = inputs[0] ?? false;
        break;
      default:
        result = false;
    }
    memo.set(gateId, result);
    return result;
  }

  // Find output gates
  const outputGates = gatesWithValues.filter((g) => g.type === "OUTPUT");
  const outputs = {};
  outputGates.forEach((og) => {
    const name = og.label || og.name || "OUT";
    outputs[name] = evalGate(og.id) ? 1 : 0;
  });
  return outputs;
}

// ── Utility: validate circuit against expected truth table ────────
function validateCircuit(gates, wires, problem) {
  if (!problem) return null;

  const inputNames = problem.inputs;
  const outputNames = problem.outputs;

  // Check that we have the right INPUT/OUTPUT gates
  const circuitInputs = gates
    .filter((g) => g.type === "INPUT")
    .map((g) => g.label || g.name);
  const circuitOutputs = gates
    .filter((g) => g.type === "OUTPUT")
    .map((g) => g.label || g.name);

  const missingInputs = inputNames.filter((i) => !circuitInputs.includes(i));
  const missingOutputs = outputNames.filter((o) => !circuitOutputs.includes(o));

  if (missingInputs.length > 0 || missingOutputs.length > 0) {
    return {
      passed: false,
      reason: "missing_ports",
      missingInputs,
      missingOutputs,
      rows: [],
    };
  }

  const combinations = generateInputCombinations(inputNames);
  const results = [];
  let allPassed = true;

  for (const combo of combinations) {
    const computed = evaluateCircuit(gates, wires, combo);

    // Find expected row
    const expected = problem.truthTable.find((row) => {
      return inputNames.every((inp) => {
        const rv = row[inp];
        if (rv === "X" || rv === undefined) return true;
        return Number(rv) === combo[inp];
      });
    });

    const rowResults = {};
    let rowPassed = true;

    for (const outName of outputNames) {
      const expVal = expected ? Number(expected[outName]) : undefined;
      const gotVal = computed[outName] ?? 0;
      const match = expVal === undefined || gotVal === expVal;
      if (!match) {
        rowPassed = false;
        allPassed = false;
      }
      rowResults[outName] = { expected: expVal, got: gotVal, match };
    }

    results.push({ inputs: combo, outputs: rowResults, rowPassed });
  }

  return {
    passed: allPassed,
    reason: allPassed ? "correct" : "wrong_output",
    rows: results,
  };
}

// ── Status badge colours ──────────────────────────────────────────
const STATUS = {
  idle: null,
  checking: {
    bg: "rgba(99,102,241,0.15)",
    border: "#6366f1",
    text: "#a5b4fc",
    icon: "⚙️",
    title: "Evaluating…",
  },
  passed: {
    bg: "rgba(0,255,136,0.08)",
    border: "#00ff88",
    text: "#00ff88",
    icon: "🎉",
    title: "Circuit Correct!",
  },
  failed: {
    bg: "rgba(255,51,102,0.1)",
    border: "#ff3366",
    text: "#ff6688",
    icon: "✗",
    title: "Circuit Incorrect",
  },
  missing: {
    bg: "rgba(255,165,0,0.1)",
    border: "#ffa500",
    text: "#ffc870",
    icon: "⚠️",
    title: "Missing Ports",
  },
};

// ── Main component ────────────────────────────────────────────────
const CircuitModal = ({ open, onClose, problem, expression, variables }) => {
  const [status, setStatus] = useState("idle"); // idle | checking | passed | failed | missing
  const [validationResult, setValidationResult] = useState(null);
  const [showValidation, setShowValidation] = useState(false);

  // Ref that Boolforge will call to expose its state
  const circuitStateRef = useRef(null);

  // Boolforge passes its state up whenever it changes
  const handleCircuitChange = useCallback((gates, wires) => {
    circuitStateRef.current = { gates, wires };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!problem) return;
    const { gates = [], wires = [] } = circuitStateRef.current || {};

    setStatus("checking");
    setShowValidation(false);

    // Small delay for UX feel
    setTimeout(() => {
      const result = validateCircuit(gates, wires, problem);
      setValidationResult(result);
      if (!result) {
        setStatus("idle");
        return;
      }

      if (result.reason === "missing_ports") setStatus("missing");
      else if (result.passed) setStatus("passed");
      else setStatus("failed");

      setShowValidation(true);
    }, 600);
  }, [problem]);

  const handleReset = () => {
    setStatus("idle");
    setValidationResult(null);
    setShowValidation(false);
  };

  if (!open) return null;

  const st = STATUS[status];
  const diffColor =
    {
      Easy: "#00ff88",
      Medium: "#00d4ff",
      Hard: "#ff3366",
    }[problem?.difficulty] || "#8899aa";

  return (
    <div
      className="cm-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("cm-overlay")) onClose();
      }}
    >
      <div className="cm-container">
        {/* ── Top bar ── */}
        <div className="cm-topbar">
          <div className="cm-topbar-left">
            <span className="cm-logo">⚡ CircuitForge</span>
            {problem && (
              <>
                <span className="cm-sep">›</span>
                <span className="cm-problem-title">{problem.title}</span>
                <span className="cm-difficulty" style={{ color: diffColor }}>
                  {problem.difficulty}
                </span>
              </>
            )}
          </div>

          <div className="cm-topbar-right">
            {problem && (
              <>
                {status === "idle" ||
                status === "failed" ||
                status === "missing" ? (
                  <button
                    className="cm-btn cm-btn-submit"
                    onClick={handleSubmit}
                  >
                    <span>✅</span> Submit Circuit
                  </button>
                ) : status === "checking" ? (
                  <button className="cm-btn cm-btn-submit" disabled>
                    <span className="cm-spin">⚙️</span> Checking…
                  </button>
                ) : status === "passed" ? (
                  <button className="cm-btn cm-btn-reset" onClick={handleReset}>
                    🔄 Try Again
                  </button>
                ) : null}
              </>
            )}
            <button className="cm-close" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* ── Status Banner ── */}
        {showValidation && st && (
          <div
            className="cm-status-banner"
            style={{
              background: st.bg,
              borderBottom: `1px solid ${st.border}`,
              color: st.text,
            }}
          >
            <div className="cm-status-header">
              <span className="cm-status-icon">{st.icon}</span>
              <strong>{st.title}</strong>
            </div>

            {/* Missing ports */}
            {status === "missing" && validationResult && (
              <div className="cm-status-detail">
                {validationResult.missingInputs?.length > 0 && (
                  <span>
                    Missing INPUTs:{" "}
                    <b>{validationResult.missingInputs.join(", ")}</b>
                  </span>
                )}
                {validationResult.missingOutputs?.length > 0 && (
                  <span>
                    Missing OUTPUTs:{" "}
                    <b>{validationResult.missingOutputs.join(", ")}</b>
                  </span>
                )}
                <span className="cm-status-hint">
                  Add named INPUT/OUTPUT gates matching the problem's port
                  names.
                </span>
              </div>
            )}

            {/* Truth table comparison */}
            {(status === "passed" || status === "failed") &&
              validationResult?.rows?.length > 0 && (
                <div className="cm-val-table-wrap">
                  <table className="cm-val-table">
                    <thead>
                      <tr>
                        {problem.inputs.map((inp) => (
                          <th key={inp}>{inp}</th>
                        ))}
                        {problem.outputs.map((out) => (
                          <React.Fragment key={out}>
                            <th className="cm-th-exp">{out} (exp)</th>
                            <th className="cm-th-got">{out} (got)</th>
                            <th>✓</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.rows.map((row, i) => (
                        <tr
                          key={i}
                          className={row.rowPassed ? "" : "cm-row-fail"}
                        >
                          {problem.inputs.map((inp) => (
                            <td key={inp}>{row.inputs[inp]}</td>
                          ))}
                          {problem.outputs.map((out) => {
                            const r = row.outputs[out];
                            return (
                              <React.Fragment key={out}>
                                <td className="cm-td-exp">
                                  {r?.expected ?? "?"}
                                </td>
                                <td
                                  className={
                                    r?.match ? "cm-td-ok" : "cm-td-err"
                                  }
                                >
                                  {r?.got ?? "?"}
                                </td>
                                <td>{r?.match ? "✓" : "✗"}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {status === "passed" && (
              <p className="cm-congrats">
                All {validationResult.rows.length} test cases passed. Excellent
                work! 🏆
              </p>
            )}
          </div>
        )}

        {/* ── Port hint strip ── */}
        {problem && (
          <div className="cm-port-strip">
            <span className="cm-port-label">Inputs:</span>
            {problem.inputs.map((inp) => (
              <span key={inp} className="cm-port-pill cm-port-in">
                {inp}
              </span>
            ))}
            <span className="cm-port-sep" />
            <span className="cm-port-label">Outputs:</span>
            {problem.outputs.map((out) => (
              <span key={out} className="cm-port-pill cm-port-out">
                {out}
              </span>
            ))}
            <span className="cm-port-hint">
              💡 Name your INPUT/OUTPUT gates to match these labels exactly
            </span>
          </div>
        )}

        {/* ── Boolforge canvas ── */}
        <div className="cm-canvas-wrap">
          <Boolforge
            simplifiedExpression={expression || null}
            variables={variables || (problem?.inputs ?? [])}
            onCircuitChange={handleCircuitChange}
          />
        </div>
      </div>

      <style>{`
                .cm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.88);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 16px;
                    backdrop-filter: blur(6px);
                }
                .cm-container {
                    position: relative;
                    width: 98vw;
                    height: 95vh;
                    max-width: 1600px;
                    background: var(--bg-primary, #0f172a);
                    border-radius: 16px;
                    box-shadow: 0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.2);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                /* ── Top bar ── */
                .cm-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 1.25rem;
                    height: 52px;
                    min-height: 52px;
                    background: var(--bg-secondary, #141b2d);
                    border-bottom: 1px solid rgba(99,102,241,0.2);
                    gap: 1rem;
                    z-index: 10;
                }
                .cm-topbar-left {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    overflow: hidden;
                }
                .cm-topbar-right {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    flex-shrink: 0;
                }
                .cm-logo {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #a5b4fc;
                    letter-spacing: 0.04em;
                    white-space: nowrap;
                }
                .cm-sep {
                    color: #4b5563;
                    font-size: 1.1rem;
                }
                .cm-problem-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-color, #e8f0ff);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 260px;
                }
                .cm-difficulty {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    padding: 0.15rem 0.5rem;
                    border-radius: 4px;
                    background: rgba(255,255,255,0.06);
                    white-space: nowrap;
                }

                /* ── Buttons ── */
                .cm-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 1rem;
                    border-radius: 8px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                    white-space: nowrap;
                }
                .cm-btn-submit {
                    background: linear-gradient(135deg, #4f46e5, #6366f1);
                    color: white;
                    box-shadow: 0 4px 12px rgba(99,102,241,0.4);
                }
                .cm-btn-submit:hover:not(:disabled) {
                    background: linear-gradient(135deg, #4338ca, #4f46e5);
                    box-shadow: 0 6px 16px rgba(99,102,241,0.5);
                    transform: translateY(-1px);
                }
                .cm-btn-submit:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cm-btn-reset {
                    background: rgba(0,212,255,0.1);
                    border: 1px solid rgba(0,212,255,0.3);
                    color: #00d4ff;
                }
                .cm-btn-reset:hover {
                    background: rgba(0,212,255,0.2);
                }
                .cm-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(239,68,68,0.15);
                    border: 1px solid rgba(239,68,68,0.3);
                    color: #f87171;
                    font-size: 1rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                .cm-close:hover {
                    background: rgba(239,68,68,0.35);
                    color: white;
                    transform: rotate(90deg);
                }

                /* ── Status banner ── */
                .cm-status-banner {
                    padding: 0.75rem 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    border-top: none;
                    flex-shrink: 0;
                    max-height: 260px;
                    overflow-y: auto;
                }
                .cm-status-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 700;
                }
                .cm-status-icon { font-size: 1.1rem; }
                .cm-status-detail {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    font-size: 0.82rem;
                    opacity: 0.9;
                }
                .cm-status-hint {
                    font-style: italic;
                    opacity: 0.7;
                }
                .cm-congrats {
                    margin: 0;
                    font-size: 0.82rem;
                    opacity: 0.85;
                }

                /* ── Validation table ── */
                .cm-val-table-wrap {
                    overflow-x: auto;
                }
                .cm-val-table {
                    border-collapse: collapse;
                    font-size: 0.76rem;
                    font-family: monospace;
                    white-space: nowrap;
                }
                .cm-val-table th,
                .cm-val-table td {
                    padding: 0.2rem 0.6rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    text-align: center;
                }
                .cm-val-table th { opacity: 0.7; font-weight: 700; }
                .cm-th-exp { opacity: 0.6; }
                .cm-th-got { opacity: 0.85; }
                .cm-td-ok { color: #00ff88; }
                .cm-td-err { color: #ff3366; font-weight: 700; }
                .cm-td-exp { opacity: 0.6; }
                .cm-row-fail { background: rgba(255,51,102,0.06); }

                /* ── Port hint strip ── */
                .cm-port-strip {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                    padding: 0.5rem 1.25rem;
                    background: rgba(0,0,0,0.2);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    flex-shrink: 0;
                    font-size: 0.75rem;
                }
                .cm-port-label {
                    font-weight: 700;
                    color: var(--secondary-text, #8899aa);
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-size: 0.68rem;
                }
                .cm-port-pill {
                    padding: 0.1rem 0.5rem;
                    border-radius: 4px;
                    font-family: monospace;
                    font-weight: 700;
                    font-size: 0.78rem;
                }
                .cm-port-in {
                    background: rgba(0,212,255,0.1);
                    border: 1px solid rgba(0,212,255,0.25);
                    color: #00d4ff;
                }
                .cm-port-out {
                    background: rgba(0,255,136,0.08);
                    border: 1px solid rgba(0,255,136,0.25);
                    color: #00ff88;
                }
                .cm-port-sep {
                    width: 1px;
                    height: 14px;
                    background: rgba(255,255,255,0.1);
                    margin: 0 0.25rem;
                }
                .cm-port-hint {
                    color: var(--secondary-text, #8899aa);
                    font-style: italic;
                    margin-left: auto;
                }

                /* ── Canvas area ── */
                .cm-canvas-wrap {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                }
                .cm-canvas-wrap > * {
                    width: 100% !important;
                    height: 100% !important;
                }

                /* ── Spinner ── */
                @keyframes cm-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                .cm-spin {
                    display: inline-block;
                    animation: cm-spin 1s linear infinite;
                }

                @media (max-width: 640px) {
                    .cm-container { width: 100vw; height: 100vh; border-radius: 0; }
                    .cm-overlay { padding: 0; }
                    .cm-port-hint { display: none; }
                }
            `}</style>
    </div>
  );
};

export default CircuitModal;
