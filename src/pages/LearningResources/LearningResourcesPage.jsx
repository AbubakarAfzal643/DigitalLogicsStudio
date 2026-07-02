import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Binary,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  GraduationCap,
  GitBranch,
  HardDrive,
  Layers3,
  ListChecks,
  MonitorPlay,
  Sparkles,
  Zap,
} from "lucide-react";
import { Navbar } from "../Home/Navbar";
import Footer from "../Home/Footer";
import { useTheme } from "../../context/ThemeContext";
import usePointerGlow from "../../hooks/usePointerGlow";
import CoreTopicsSection from "../../components/topics/CoreTopicsSection";
import coreTopics from "../../data/coreTopics";
import "../Home/Home.css";
import "./LearningResourcesPage.css";

const trackConfig = {
  dld: {
    slug: "dld",
    title: "Digital Logic Design",
    eyebrow: "Foundation Track",
    description:
      "A polished study hub for number systems, Boolean algebra, combinational circuits, and timing concepts.",
    accent: "#3b82f6",
    icon: Cpu,
    quickLinks: [
      {
        title: "Chapter 1 Practice",
        description: "Start with basics, logic gates, and number systems.",
        to: "/book",
        icon: BookOpen,
      },
      {
        title: "Chapter 2 Practice",
        description: "Move to simplification, K-maps, and circuit design.",
        to: "/book/ch2",
        icon: Layers3,
      },
      {
        title: "Timing Diagrams",
        description: "Visualize how digital signals evolve over time.",
        to: "/timing-diagrams",
        icon: Sparkles,
      },
    ],
    concepts: [
      {
        title: "Logic Gates",
        description:
          "Understand AND, OR, NOT, NAND, NOR, XOR, and XNOR behavior.",
      },
      {
        title: "Boolean Algebra",
        description:
          "Practice simplification, duality, and algebraic identities.",
      },
      {
        title: "Karnaugh Maps",
        description: "Reduce complex expressions into simpler circuits.",
      },
      {
        title: "Sequential Logic",
        description:
          "Explore latches, flip-flops, counters, and memory basics.",
      },
    ],
    studyPlan: [
      "Review the fundamentals of logic gates and truth tables.",
      "Practice simplification using Boolean laws and K-maps.",
      "Connect theory with interactive timing and circuit tools.",
    ],
  },
  coal: {
    slug: "coal",
    title: "COAL Language",
    eyebrow: "Beginner Track",
    description:
      "A beginner-friendly learning space for COAL concepts, instruction flow, and first practice problems.",
    accent: "#8b5cf6",
    icon: Code2,
    quickLinks: [
      {
        title: "Core Concepts",
        description: "Start with the building blocks of COAL language.",
        to: "#concepts",
        icon: BrainCircuit,
      },
      {
        title: "Practice Problems",
        description: "Try simple beginner exercises to build confidence.",
        to: "#practice",
        icon: GraduationCap,
      },
    ],
    concepts: [
      {
        title: "COAL Syntax Basics",
        description:
          "Learn how instructions, labels, and comments are structured.",
      },
      {
        title: "Registers and Memory",
        description:
          "Understand how values are stored and moved in a simple machine.",
      },
      {
        title: "Control Flow",
        description:
          "Practice branching, jumps, and decision-making instructions.",
      },
      {
        title: "Instruction Logic",
        description:
          "Build confidence with basic arithmetic and data movement tasks.",
      },
    ],
    visualConcepts: [
      {
        title: "Fetch → Decode → Execute",
        description:
          "See how the CPU steps through each instruction and updates the program flow.",
        icon: MonitorPlay,
      },
      {
        title: "Registers in Action",
        description:
          "Understand how AX, BX, CX, and DX hold temporary values during computation.",
        icon: Cpu,
      },
      {
        title: "Control Flow Logic",
        description:
          "Learn how jumps and comparisons guide the program from one instruction to another.",
        icon: Zap,
      },
    ],
    demoCode: [
      {
        title: "Simple data movement",
        code: `MOV AX, 5\nMOV BX, 10\nADD AX, BX`,
      },
      {
        title: "Branch example",
        code: `CMP AX, BX\nJE equal_label\nJNE continue`,
      },
      {
        title: "Looping idea",
        code: `MOV CX, 5\nloop_start:\nADD AX, 1\nLOOP loop_start`,
      },
    ],
    practiceQuestions: [
      {
        difficulty: "Beginner",
        title: "What does MOV do?",
        prompt:
          "Explain the purpose of a MOV instruction and give one example.",
      },
      {
        difficulty: "Beginner",
        title: "Register understanding",
        prompt:
          "Name two registers and describe what each is commonly used for.",
      },
      {
        difficulty: "Intermediate",
        title: "Branch logic",
        prompt:
          "How does a jump instruction change the order of execution in a program?",
      },
      {
        difficulty: "Intermediate",
        title: "Flag awareness",
        prompt:
          "What happens when a comparison instruction is executed before a conditional jump?",
      },
    ],
    courseTopics: [
      {
        id: "basics",
        icon: Cpu,
        title: "Topic 1: Basic Concepts of Computer Organization",
        summary:
          "Understand how computer organization explains the hardware structure behind instruction execution and system behavior.",
        points: [
          "Study the relationship between computer organization, architecture, and software interfaces.",
          "Review binary, decimal, hexadecimal, signed representations, and floating-point basics.",
          "Explore the ISA contract, instruction categories, addressing modes, and memory organization.",
          "Connect the ideas to assembly basics such as MOV, ADD, SUB, CMP, and JMP.",
        ],
        code: "MOV AX, 5\nMOV BX, 3\nADD AX, BX",
      },
      {
        id: "hardware",
        icon: HardDrive,
        title: "Topic 2: Interfacing and Communication with Hardware",
        summary:
          "Trace how the CPU talks to devices through input/output mechanisms, interrupts, and buses.",
        points: [
          "Compare programmed I/O, interrupt-driven I/O, and DMA for handling peripheral devices.",
          "Understand hardware and software interrupts, IVT or IDT, and interrupt service routines.",
          "Learn how data, address, and control buses carry information between components.",
          "See how storage systems and RAID concepts impact performance and reliability.",
        ],
        code: "IN AL, 60h\nCMP AL, 0x01\nJE handle_key",
      },
      {
        id: "assembly",
        icon: Binary,
        title:
          "Topic 3: Illustrating Computer Organization via Assembly Language Programming",
        summary:
          "Use assembly as a direct view into registers, flags, memory access, and control flow at the hardware level.",
        points: [
          "Practice data movement, arithmetic, logic, shifts, and rotate operations in assembly.",
          "Use comparison and conditional jumps to build if-else and loop structures.",
          "Explore procedures, recursion, and string instructions with stack-based control.",
          "Build confidence with array traversal, simple sorting, and number conversion routines.",
        ],
        code: "CMP AX, BX\nJG greater\nJLE lesser",
      },
      {
        id: "ia32",
        icon: Layers3,
        title: "Topic 4: Introduction to Intel IA-32 Architecture",
        summary:
          "Map the 32-bit x86 architecture to real registers, memory management, and instruction encoding concepts.",
        points: [
          "Study the general-purpose, segment, and status registers that define the execution environment.",
          "Differentiate real mode, protected mode, and virtual-8086 mode.",
          "Understand segmentation, paging, and privilege levels in memory management.",
          "Connect instruction prefixes, opcodes, ModR/M, SIB, and displacement fields to machine encoding.",
        ],
        code: "MOV EAX, [EBX]\nADD EAX, 4",
      },
      {
        id: "directives",
        icon: Code2,
        title:
          "Topic 5: Assembly Language Directives, Macros, Operators, and Program Structure",
        summary:
          "Learn how assemblers organize code, data, and procedures into a complete executable program.",
        points: [
          "Use directives like .data, .code, .stack, PROC, and ENDP to structure a program.",
          "Create reusable code with macros, local labels, and conditional assembly.",
          "Apply operators such as OFFSET, PTR, SIZE, LENGTH, and memory indexing syntax.",
          "Follow the build pipeline from assembly to object code and linked executable files.",
        ],
        code: ".data\nvalue DB 10\n.code\nmain PROC",
      },
      {
        id: "interface",
        icon: GitBranch,
        title: "Topic 6: Interrelationship Between Hardware and Software",
        summary:
          "See how high-level programs become assembly instructions, machine code, and hardware actions.",
        points: [
          "Connect compiler, assembler, linker, and operating system roles in the translation chain.",
          "Understand how variables become memory locations, and functions become stack frames.",
          "See how control structures turn into jumps and branches at runtime.",
          "Recognize how hardware constraints influence software efficiency and system design.",
        ],
        code: "CALL compute\nRET",
      },
      {
        id: "families",
        icon: BookOpen,
        title: "Topic 7: Comparison Between Different Processor Families",
        summary:
          "Compare the design philosophies behind x86, AMD64, ARM, MIPS, PowerPC, and RISC-V.",
        points: [
          "Contrast CISC and RISC architectures by complexity, power, and performance trade-offs.",
          "See how x86 evolved from 16-bit through 32-bit and into 64-bit instruction sets.",
          "Review why ARM dominates mobile and embedded devices while x86 remains strong in desktop systems.",
          "Explore licensing and compatibility considerations that shape processor ecosystems.",
        ],
        code: "; x86 vs ARM\nMOV EAX, 1\n; load-store style instruction flow",
      },
      {
        id: "pipelining",
        icon: Zap,
        title: "Topic 8: Introduction to Computer Architecture and Pipelining",
        summary:
          "Discover how modern processors improve throughput using instruction cycles, pipelines, and hazard awareness.",
        points: [
          "Review the fetch-decode-execute-writeback flow and the role of the control unit and ALU.",
          "Understand pipelining through the classic five-stage execution model.",
          "Identify structural, data, and control hazards and the strategies used to reduce their impact.",
          "Connect pipelining ideas to performance metrics, superscalar execution, and out-of-order design.",
        ],
        code: "IF ID EX MEM WB\n; overlapping instruction stages",
      },
    ],
    studyPlan: [
      "Start with the basic structure of COAL instructions and syntax.",
      "Understand registers, memory, and simple data movement.",
      "Practice branching and beginner problems before advancing to more complex topics.",
    ],
    roadmapPhases: [
      {
        phase: "Phase 1",
        title: "Computer Fundamentals",
        duration: "1 Week",
        points: ["What is a computer?", "CPU, memory, I/O, bus, clock cycles"],
      },
      {
        phase: "Phase 2",
        title: "Number Systems",
        duration: "3–4 Days",
        points: [
          "Binary, decimal, hexadecimal, octal",
          "1's and 2's complement, signed vs unsigned",
        ],
      },
      {
        phase: "Phase 3",
        title: "Boolean Algebra & Logic Gates",
        duration: "1 Week",
        points: [
          "AND, OR, NOT, XOR, NAND, NOR",
          "Truth tables, De Morgan's law, K-maps",
        ],
      },
      {
        phase: "Phase 4",
        title: "Digital Logic Circuits",
        duration: "1 Week",
        points: [
          "Half/full adder",
          "Decoder, encoder, multiplexer, demultiplexer",
        ],
      },
      {
        phase: "Phase 5",
        title: "Computer Organization",
        duration: "4–5 Days",
        points: [
          "ALU, control unit, registers",
          "Cache, main memory, secondary memory",
        ],
      },
      {
        phase: "Phase 6",
        title: "Instruction Cycle",
        duration: "3 Days",
        points: [
          "Fetch, decode, execute, store",
          "Program counter and instruction register",
        ],
      },
      {
        phase: "Phase 7",
        title: "Assembly Language Basics",
        duration: "3 Days",
        points: ["Basic syntax", "MOV, ADD, SUB, JMP, comparison instructions"],
      },
      {
        phase: "Phase 8",
        title: "Assembly Instructions",
        duration: "1 Week",
        points: [
          "Data transfer, arithmetic, logic, shift",
          "Control flow and loops",
        ],
      },
      {
        phase: "Phase 9",
        title: "Flags Register",
        duration: "3 Days",
        points: [
          "Zero, carry, overflow, sign flags",
          "How comparisons affect flags",
        ],
      },
      {
        phase: "Phase 10",
        title: "Addressing Modes",
        duration: "4 Days",
        points: [
          "Immediate, register, direct, indirect",
          "Indexed and base-indexed addressing",
        ],
      },
      {
        phase: "Phase 11",
        title: "Stack & Procedures",
        duration: "4 Days",
        points: ["PUSH, POP, CALL, RET", "Parameters and local variables"],
      },
      {
        phase: "Phase 12",
        title: "Arrays, Strings & Interrupts",
        duration: "1 Week",
        points: [
          "Array access and string instructions",
          "Interrupt-driven input/output",
        ],
      },
    ],
  },
};

const LearningResourcesPage = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const { track } = useParams();
  const resolvedTrack = track === "coal" ? "coal" : "dld";
  const content = trackConfig[resolvedTrack];
  const glowRootRef = usePointerGlow({ color: content.accent, alpha: 0.2 });
  const courseTopics = content?.courseTopics ?? [];
  const [expandedTopic, setExpandedTopic] = useState("basics");

  const activeTopicIndex = courseTopics.findIndex(
    (topic) => topic.id === expandedTopic,
  );
  const progressPercent =
    activeTopicIndex >= 0 && courseTopics.length > 0
      ? ((activeTopicIndex + 1) / courseTopics.length) * 100
      : 0;

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    if (resolvedTrack === "coal" && courseTopics.length > 0) {
      setExpandedTopic((current) => (current ? current : "basics"));
      return;
    }

    setExpandedTopic("");
  }, [resolvedTrack, courseTopics.length]);

  if (track && !trackConfig[track]) {
    return <Navigate to="/resources/dld" replace />;
  }

  const Icon = content.icon;

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnchorClick = (target) => {
    const id = target.replace("#", "");
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="learning-resources-page" ref={glowRootRef}>
      <div className="grid-background" />
      <Navbar
        toggleTheme={toggleTheme}
        theme={theme}
        onHomeClick={handleHomeClick}
      />

      <main className="learning-resources-main">
        <section className="learning-resources-hero">
          <div className="learning-resources-hero-content">
            <span className="learning-resources-badge">{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p>{content.description}</p>

            <div className="learning-resources-hero-actions">
              <Link to="/" className="learning-resources-btn primary">
                <ArrowLeft size={16} />
                Back to home
              </Link>
              <Link
                to={
                  resolvedTrack === "dld" ? "/resources/coal" : "/resources/dld"
                }
                className="learning-resources-btn secondary"
              >
                Explore {resolvedTrack === "dld" ? "COAL" : "DLD"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div
            className="learning-resources-hero-card"
            style={{ borderColor: `${content.accent}40` }}
          >
            <div
              className="learning-resources-hero-icon"
              style={{
                background: `${content.accent}16`,
                color: content.accent,
              }}
            >
              <Icon size={30} />
            </div>
            <h2>Study focus</h2>
            <p>
              {resolvedTrack === "dld"
                ? "Strengthen your foundation in digital logic with guided practice and visual tools."
                : "Build confidence with beginner-level COAL topics and structured problem practice."}
            </p>
          </div>
        </section>

        <section className="learning-resources-section">
          <div className="learning-resources-section-header">
            <h2>Start with these resources</h2>
            <p>
              Choose a path that matches your current level and learning goal.
            </p>
          </div>

          <div className="learning-resources-grid">
            {content.quickLinks.map((item) => {
              const ItemIcon = item.icon;
              const isAnchor = item.to?.startsWith("#");

              return isAnchor ? (
                <button
                  key={item.title}
                  type="button"
                  className="learning-resources-card learning-resources-card-button learning-resources-glow-card"
                  onClick={() => handleAnchorClick(item.to)}
                >
                  <div className="learning-resources-card-top">
                    <div className="learning-resources-card-meta">
                      <div
                        className="learning-resources-card-icon"
                        style={{ color: content.accent }}
                      >
                        <ItemIcon size={24} />
                      </div>
                      <div className="learning-resources-card-copy">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                    <span className="learning-resources-card-link">
                      Open <ArrowRight size={16} />
                    </span>
                  </div>
                </button>
              ) : (
                <Link
                  key={item.title}
                  to={item.to}
                  className="learning-resources-card learning-resources-glow-card"
                >
                  <div className="learning-resources-card-top">
                    <div className="learning-resources-card-meta">
                      <div
                        className="learning-resources-card-icon"
                        style={{ color: content.accent }}
                      >
                        <ItemIcon size={24} />
                      </div>
                      <div className="learning-resources-card-copy">
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                    </div>
                    <span className="learning-resources-card-link">
                      Open <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="concepts" className="learning-resources-section">
          <div className="learning-resources-section-header">
            <h2>Beginner concepts</h2>
            <p>
              Core ideas to study first before moving on to more advanced
              material.
            </p>
          </div>

          <div className="learning-resources-concepts-grid">
            {content.concepts.map((concept) => (
              <article
                key={concept.title}
                className="learning-resources-concept-card"
              >
                <h3>{concept.title}</h3>
                <p>{concept.description}</p>
              </article>
            ))}
          </div>
        </section>

        {resolvedTrack === "coal" ? (
          <>
            <section className="learning-resources-section">
              <div className="learning-resources-section-header">
                <h2>Visual concept highlights</h2>
                <p>
                  Quick mental models to connect machine behavior with assembly
                  concepts.
                </p>
              </div>

              <div className="learning-resources-visual-grid">
                {content.visualConcepts.map((item) => {
                  const VisualIcon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="learning-resources-visual-card"
                    >
                      <div className="learning-resources-card-top">
                        <div className="learning-resources-card-meta">
                          <div className="learning-resources-card-icon">
                            <VisualIcon size={24} />
                          </div>
                          <div className="learning-resources-card-copy">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="learning-resources-section">
              <div className="learning-resources-section-header">
                <h2>Mini demo code</h2>
                <p>
                  Small examples that help you see how assembly instructions
                  look in practice.
                </p>
              </div>

              <div className="learning-resources-demo-grid">
                {content.demoCode.map((item) => (
                  <article
                    key={item.title}
                    className="learning-resources-demo-card"
                  >
                    <div className="learning-resources-card-top">
                      <div className="learning-resources-card-meta">
                        <div className="learning-resources-card-icon">
                          <Code2 size={24} />
                        </div>
                        <div className="learning-resources-card-copy">
                          <h3>{item.title}</h3>
                          <pre>{item.code}</pre>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section id="practice" className="learning-resources-section">
              <div className="learning-resources-section-header">
                <h2>Practice questions</h2>
                <p>
                  Try these beginner-friendly questions and grade yourself by
                  difficulty.
                </p>
              </div>

              <div className="learning-resources-practice-grid">
                {content.practiceQuestions.map((question) => (
                  <article
                    key={question.title}
                    className="learning-resources-practice-card"
                  >
                    <div className="learning-resources-practice-top">
                      <span className="learning-resources-difficulty">
                        {question.difficulty}
                      </span>
                      <span className="learning-resources-idea">
                        <ListChecks size={15} /> Practice
                      </span>
                    </div>
                    <div className="learning-resources-card-meta">
                      <div className="learning-resources-card-icon">
                        <ListChecks size={24} />
                      </div>
                      <div className="learning-resources-card-copy">
                        <h3>{question.title}</h3>
                        <p>{question.prompt}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="course-content"
              className="learning-resources-section learning-resources-course-section"
            >
              <div className="learning-resources-section-header">
                <h2>Complete COAL course content</h2>
                <p>
                  A polished, topic-by-topic study guide designed for quick
                  navigation and deeper revision.
                </p>
              </div>

              <div className="learning-resources-course-shell">
                <aside className="learning-resources-course-nav">
                  <div className="learning-resources-course-nav-card">
                    <p className="learning-resources-course-nav-label">
                      Study path
                    </p>
                    <h3>Topic overview</h3>
                    <div className="learning-resources-course-progress">
                      <div
                        className="learning-resources-course-progress-track"
                        aria-hidden="true"
                      >
                        <span
                          className="learning-resources-course-progress-fill"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="learning-resources-course-progress-meta">
                        <span>
                          {activeTopicIndex >= 0 ? activeTopicIndex + 1 : 0}/
                          {courseTopics.length}
                        </span>
                        <span>
                          {activeTopicIndex >= 0
                            ? "Active topic"
                            : "Select a topic"}
                        </span>
                      </div>
                    </div>
                    <nav className="learning-resources-course-nav-list">
                      {courseTopics.map((topic, index) => {
                        const isActive = expandedTopic === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            className={`learning-resources-course-nav-item ${isActive ? "active" : ""}`}
                            onClick={() =>
                              setExpandedTopic(isActive ? "" : topic.id)
                            }
                          >
                            <span className="learning-resources-course-nav-index">
                              {index + 1}
                            </span>
                            <span className="learning-resources-course-nav-copy">
                              <strong>{topic.title.split(":")[0]}</strong>
                              <small>
                                {topic.title.split(":")[1] ||
                                  "Core study module"}
                              </small>
                            </span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </aside>

                <div className="learning-resources-course-topics">
                  {courseTopics.map((topic) => {
                    const TopicIcon = topic.icon;
                    const isOpen = expandedTopic === topic.id;

                    return (
                      <article
                        key={topic.id}
                        className={`learning-resources-course-card ${isOpen ? "open" : ""}`}
                      >
                        <button
                          className="learning-resources-course-card-toggle"
                          type="button"
                          onClick={() =>
                            setExpandedTopic(isOpen ? "" : topic.id)
                          }
                        >
                          <div className="learning-resources-course-card-heading">
                            <div className="learning-resources-course-icon">
                              <TopicIcon size={18} />
                            </div>
                            <div>
                              <p className="learning-resources-course-eyebrow">
                                COAL module
                              </p>
                              <h3>{topic.title}</h3>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>

                        {isOpen ? (
                          <div className="learning-resources-course-card-body">
                            <p>{topic.summary}</p>
                            <ul>
                              {topic.points.map((point) => (
                                <li key={point}>{point}</li>
                              ))}
                            </ul>
                            <pre>{topic.code}</pre>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="learning-resources-course-footer">
                <div>
                  <p className="learning-resources-course-eyebrow">
                    Suggested practical work
                  </p>
                  <h3>Build confidence with guided labs</h3>
                </div>
                <p>
                  Use NASM, MASM, TASM, or an x86 emulator to practice data
                  representation, I/O handling, interrupts, and full assembly
                  mini-projects.
                </p>
              </div>
            </section>
          </>
        ) : null}

        {resolvedTrack === "dld" ? (
          <CoreTopicsSection topics={coreTopics} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default LearningResourcesPage;
