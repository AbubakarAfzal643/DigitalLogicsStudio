import React, { useState } from "react";
import CircuitModal from "../../../components/CircuitModal";
import "./Problems.css";

const difficultyColor = {
  Easy: "var(--accent-primary, #00ff88)",
  Medium: "var(--accent-secondary, #00d4ff)",
  Hard: "var(--accent-danger, #ff3366)",
};

const ProblemModal = ({ problem, onClose }) => {
  const [circuitOpen, setCircuitOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  if (!problem) return null;

  // If circuit modal is fullscreen, render it on top
  if (circuitOpen) {
    return (
      <CircuitModal
        open={true}
        onClose={() => setCircuitOpen(false)}
        problem={problem}
      />
    );
  }

  return (
    <div className="prob-modal-overlay" onClick={onClose}>
      <div className="prob-modal" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className="prob-modal-header">
          <div>
            <span className="prob-id">#{problem.id}</span>
            <h2 className="prob-modal-title">{problem.title}</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              className="prob-difficulty"
              style={{
                color: difficultyColor[problem.difficulty],
                fontSize: "1rem",
              }}
            >
              {problem.difficulty}
            </span>
            <button className="prob-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="prob-modal-body">
          {/* ── Left: problem details ── */}
          <div className="prob-modal-left">
            <section className="prob-section">
              <h4>Description</h4>
              <p>{problem.description}</p>
            </section>

            <section className="prob-section">
              <h4>Boolean Equations</h4>
              <div className="prob-equations">
                {problem.equations.map((eq, i) => (
                  <code key={i} className="prob-eq">
                    {eq}
                  </code>
                ))}
              </div>
            </section>

            <section className="prob-section">
              <h4>Truth Table</h4>
              <div className="prob-table-wrap">
                <table className="prob-truth-table">
                  <thead>
                    <tr>
                      {Object.keys(problem.truthTable[0]).map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {problem.truthTable.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td
                            key={j}
                            className={
                              typeof val === "number" && val === 1
                                ? "cell-one"
                                : ""
                            }
                          >
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {showHint && (
              <section className="prob-section prob-hint">
                <h4>💡 Hint</h4>
                <p>{problem.hint}</p>
              </section>
            )}

            <button
              className="prob-hint-btn"
              onClick={() => setShowHint((v) => !v)}
            >
              {showHint ? "Hide Hint" : "Show Hint"}
            </button>
          </div>

          {/* ── Right: circuit builder CTA ── */}
          <div className="prob-modal-right">
            <div className="prob-forge-panel">
              <div className="prob-forge-icon">⚡</div>
              <h4>Build in CircuitForge</h4>
              <p>
                Open the interactive circuit builder, wire up your design using
                the required gates, then hit <strong>Submit Circuit</strong> —
                the system will validate every row of the truth table
                automatically.
              </p>

              {/* I/O reference */}
              <div className="prob-io-info">
                <div>
                  <span className="prob-io-label">Inputs</span>
                  <div className="prob-io-pills">
                    {problem.inputs.map((inp) => (
                      <span key={inp} className="prob-io-pill input-pill">
                        {inp}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="prob-io-label">Outputs</span>
                  <div className="prob-io-pills">
                    {problem.outputs.map((out) => (
                      <span key={out} className="prob-io-pill output-pill">
                        {out}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Important naming note */}
              <div className="prob-naming-note">
                <span className="prob-naming-icon">ℹ️</span>
                <span>
                  Name your INPUT and OUTPUT gates to match the labels above
                  exactly — the validator checks them by name.
                </span>
              </div>

              <button
                className="prob-forge-btn"
                onClick={() => setCircuitOpen(true)}
              >
                🔧 Open Circuit Builder
              </button>

              {/* What happens inside */}
              <div className="prob-divider" />
              <div className="prob-workflow">
                <div className="prob-workflow-step">
                  <span className="prob-workflow-num">1</span>
                  <span>Add and connect logic gates on the canvas</span>
                </div>
                <div className="prob-workflow-step">
                  <span className="prob-workflow-num">2</span>
                  <span>
                    Label INPUT / OUTPUT gates to match the port names
                  </span>
                </div>
                <div className="prob-workflow-step">
                  <span className="prob-workflow-num">3</span>
                  <span>
                    Click <strong>Submit Circuit</strong> — get instant
                    pass/fail feedback with a truth-table diff
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Extra styles for new elements */}
      <style>{`
                .prob-naming-note {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;
                    background: rgba(255,165,0,0.07);
                    border: 1px solid rgba(255,165,0,0.2);
                    border-radius: 8px;
                    padding: 0.6rem 0.75rem;
                    font-size: 0.8rem;
                    color: #ffc870;
                    line-height: 1.5;
                    margin: 0.25rem 0;
                }
                .prob-naming-icon { flex-shrink: 0; }

                .prob-workflow {
                    display: flex;
                    flex-direction: column;
                    gap: 0.6rem;
                }
                .prob-workflow-step {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.6rem;
                    font-size: 0.82rem;
                    color: var(--secondary-text, #8899aa);
                    line-height: 1.5;
                }
                .prob-workflow-num {
                    flex-shrink: 0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(99,102,241,0.2);
                    border: 1px solid rgba(99,102,241,0.4);
                    color: #a5b4fc;
                    font-size: 0.72rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 1px;
                }
            `}</style>
    </div>
  );
};

export default ProblemModal;
