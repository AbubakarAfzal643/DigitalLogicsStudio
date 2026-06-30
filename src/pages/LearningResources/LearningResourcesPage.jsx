import React from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Code2,
  Cpu,
  GraduationCap,
  Layers3,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../Home/Navbar";
import Footer from "../Home/Footer";
import { useTheme } from "../../context/ThemeContext";
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
        description: "Understand AND, OR, NOT, NAND, NOR, XOR, and XNOR behavior.",
      },
      {
        title: "Boolean Algebra",
        description: "Practice simplification, duality, and algebraic identities.",
      },
      {
        title: "Karnaugh Maps",
        description: "Reduce complex expressions into simpler circuits.",
      },
      {
        title: "Sequential Logic",
        description: "Explore latches, flip-flops, counters, and memory basics.",
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
      {
        title: "Study Roadmap",
        description: "Follow a simple path from basics to deeper topics.",
        to: "#roadmap",
        icon: BookOpen,
      },
    ],
    concepts: [
      {
        title: "COAL Syntax Basics",
        description: "Learn how instructions, labels, and comments are structured.",
      },
      {
        title: "Registers and Memory",
        description: "Understand how values are stored and moved in a simple machine.",
      },
      {
        title: "Control Flow",
        description: "Practice branching, jumps, and decision-making instructions.",
      },
      {
        title: "Instruction Logic",
        description: "Build confidence with basic arithmetic and data movement tasks.",
      },
    ],
    studyPlan: [
      "Start with the basic structure of COAL instructions and syntax.",
      "Understand registers, memory, and simple data movement.",
      "Practice branching and beginner problems before advancing to more complex topics.",
    ],
  },
};

const LearningResourcesPage = () => {
  const { theme, toggle: toggleTheme } = useTheme();
  const { track } = useParams();
  const resolvedTrack = track === "coal" ? "coal" : "dld";
  const content = trackConfig[resolvedTrack];

  if (track && !trackConfig[track]) {
    return <Navigate to="/resources/dld" replace />;
  }

  const Icon = content.icon;

  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="learning-resources-page">
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
                Back to home
              </Link>
              <Link
                to={resolvedTrack === "dld" ? "/resources/coal" : "/resources/dld"}
                className="learning-resources-btn secondary"
              >
                Explore {resolvedTrack === "dld" ? "COAL" : "DLD"}
              </Link>
            </div>
          </div>

          <div className="learning-resources-hero-card" style={{ borderColor: `${content.accent}40` }}>
            <div className="learning-resources-hero-icon" style={{ background: `${content.accent}16`, color: content.accent }}>
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
            <p>Choose a path that matches your current level and learning goal.</p>
          </div>

          <div className="learning-resources-grid">
            {content.quickLinks.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link key={item.title} to={item.to} className="learning-resources-card">
                  <div className="learning-resources-card-icon" style={{ color: content.accent }}>
                    <ItemIcon size={20} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="learning-resources-card-link">
                    Open <ArrowRight size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section id="concepts" className="learning-resources-section">
          <div className="learning-resources-section-header">
            <h2>Beginner concepts</h2>
            <p>Core ideas to study first before moving on to more advanced material.</p>
          </div>

          <div className="learning-resources-concepts-grid">
            {content.concepts.map((concept) => (
              <article key={concept.title} className="learning-resources-concept-card">
                <h3>{concept.title}</h3>
                <p>{concept.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="practice" className="learning-resources-section">
          <div className="learning-resources-section-header">
            <h2>Practice and direction</h2>
            <p>Use this simple roadmap to keep your study sessions organized.</p>
          </div>

          <div className="learning-resources-roadmap">
            {content.studyPlan.map((step, index) => (
              <div key={step} className="learning-resources-roadmap-item">
                <div className="learning-resources-roadmap-number">{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LearningResourcesPage;
