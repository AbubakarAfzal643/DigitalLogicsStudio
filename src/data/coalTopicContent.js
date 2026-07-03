/**
 * Rich lesson content for COAL course modules.
 * Preview = short summary when accordion opens.
 * sections = full content revealed via "Explore full topic" button.
 */

const coalTopicContent = {
  "intro-computer-organization": {
    slug: "intro-computer-organization",
    level: "Beginner",
    duration: "3 days",
    preview: {
      summary:
        "Before writing assembly, you need a mental picture of how a computer is built and how software talks to hardware. This module introduces that picture in plain language.",
      highlights: [
        "Organization vs architecture vs ISA — three layers students often mix up",
        "The Von Neumann idea: program and data live in the same memory",
        "CPU, memory, I/O, and buses — what each part does in real machines",
      ],
    },
    sections: [
      {
        id: "what-is-coal",
        title: "What is COAL?",
        body: [
          "COAL stands for Computer Organization and Assembly Language. It sits between digital logic (gates and circuits) and high-level programming (Python, Java, C++).",
          "Organization explains how hardware is arranged. Assembly language is the human-readable form of machine instructions the CPU understands.",
        ],
        realLife: {
          title: "Real-life connection",
          text: "When you tap Like on a social app, your phone runs millions of machine instructions. COAL teaches you to read and write those instructions at the lowest practical level — like understanding how a car engine works before only driving automatic.",
        },
      },
      {
        id: "three-layers",
        title: "Organization vs Architecture vs ISA",
        body: [
          "These three terms appear in every COAL textbook. Think of them as zoom levels on the same machine.",
        ],
        table: {
          caption: "Three layers of a computer (simple view)",
          headers: ["Term", "What it means", "Everyday analogy"],
          rows: [
            [
              "Computer Organization",
              "How components are built and connected (ALU, buses, memory chips)",
              "How rooms and wiring are laid out in a house",
            ],
            [
              "Computer Architecture",
              "What the machine exposes to software (registers, instruction types)",
              "The floor plan a resident actually uses",
            ],
            [
              "ISA (Instruction Set)",
              "The exact vocabulary of instructions (MOV, ADD, JMP…)",
              "The language manual for that house's appliances",
            ],
          ],
        },
      },
      {
        id: "von-neumann",
        title: "The Von Neumann Model",
        body: [
          "Most computers today follow the Von Neumann stored-program model: both instructions and data are stored in memory. The CPU fetches instructions one after another and executes them.",
        ],
        diagram: "von-neumann",
        realLife: {
          title: "Real-life connection",
          text: "A recipe app stores recipes (data) and the steps to display them (instructions) in the same phone memory. The CPU reads each step, performs it, then moves to the next — exactly like executing a program.",
        },
      },
      {
        id: "main-components",
        title: "Main Hardware Components",
        body: ["Every desktop, laptop, and microcontroller contains the same core building blocks."],
        table: {
          caption: "Core components and their jobs",
          headers: ["Component", "Job", "Real-world example"],
          rows: [
            ["CPU", "Executes instructions, performs arithmetic and logic", "The chef in a kitchen"],
            ["Memory (RAM)", "Stores programs and data while power is on", "The countertop workspace"],
            ["I/O devices", "Keyboard, screen, disk, network — talk to the outside world", "Waiters bringing orders in and plates out"],
            ["System bus", "Shared wires moving addresses, data, and control signals", "The hallway connecting kitchen, pantry, and dining room"],
          ],
        },
        diagram: "system-bus",
      },
      {
        id: "why-assembly",
        title: "Why Learn Assembly?",
        body: [
          "High-level languages hide hardware details. Assembly removes that hiding — useful for debugging, embedded systems, security research, and understanding performance.",
        ],
        table: {
          caption: "Where COAL knowledge helps",
          headers: ["Field", "Why assembly matters"],
          rows: [
            ["Embedded / IoT", "Microcontrollers often have no Python runtime — you write assembly or C close to metal"],
            ["Cybersecurity", "Exploits target memory layout, stack, and CPU flags"],
            ["Game / graphics engines", "Hot loops are tuned knowing cache and registers"],
            ["Compilers", "Understanding how `if` and `for` become jumps and compares"],
          ],
        },
      },
    ],
    keyTakeaways: [
      "Organization = hardware structure; Architecture = programmer's view; ISA = instruction vocabulary.",
      "Von Neumann machines store programs and data in the same memory.",
      "CPU + memory + I/O + bus is the mental model for every module that follows.",
    ],
  },

  "number-systems-representation": {
    slug: "number-systems-representation",
    level: "Beginner",
    duration: "4 days",
    preview: {
      summary:
        "Computers only understand 0 and 1. Every number, character, and pixel you see is stored as bit patterns. This module shows how to read and convert those patterns.",
      highlights: [
        "Binary, decimal, octal, and hexadecimal — when to use each",
        "Signed integers with 1's and 2's complement",
        "How letters and symbols become ASCII codes",
      ],
    },
    sections: [
      {
        id: "why-binary",
        title: "Why Binary?",
        body: [
          "Electronic circuits are reliable at two stable states: on (1) and off (0). Binary is base-2 — each digit is a bit (binary digit).",
          "A byte is 8 bits and can represent 256 different values (0–255 unsigned).",
        ],
        realLife: {
          title: "Real-life connection",
          text: "A light switch has two positions — not five. Engineers chose binary because transistors behave like billions of tiny switches. Your Wi-Fi password, file size, and CPU register values are all bit patterns underneath.",
        },
        diagram: "binary-byte",
      },
      {
        id: "positional-bases",
        title: "Positional Number Systems",
        body: [
          "In any base B, each digit position has a weight Bⁿ. COAL uses decimal (everyday), binary (machine), octal (legacy), and hexadecimal (compact binary shorthand).",
        ],
        table: {
          caption: "Same value (13₁₀) in different bases",
          headers: ["Base", "Name", "Representation", "Common use in COAL"],
          rows: [
            ["10", "Decimal", "13", "Human-readable numbers in comments and debugging"],
            ["2", "Binary", "1101", "True form inside registers and memory"],
            ["8", "Octal", "15", "Older Unix file permissions (e.g. chmod 755)"],
            ["16", "Hexadecimal", "D", "Memory dumps, addresses, color codes (#FF5733)"],
          ],
        },
        realLife: {
          title: "Real-life connection",
          text: "Web designers use hex for colors: #FF0000 is pure red — FF = 255 red, 00 green, 00 blue. Each pair is one byte in hex, easier to read than 111111110000000000000000.",
        },
      },
      {
        id: "conversion-quick",
        title: "Quick Conversion Reference",
        body: [
          "Decimal → binary: repeated division by 2, collect remainders bottom-up. Binary → hex: group bits in fours from the right.",
        ],
        table: {
          caption: "Handy conversion cheat sheet",
          headers: ["Decimal", "Binary", "Hex"],
          rows: [
            ["0", "0000", "0"],
            ["5", "0101", "5"],
            ["10", "1010", "A"],
            ["15", "1111", "F"],
            ["16", "1 0000", "10"],
            ["255", "1111 1111", "FF"],
          ],
        },
        diagram: "dec-to-bin",
      },
      {
        id: "signed-numbers",
        title: "Signed Numbers: 1's and 2's Complement",
        body: [
          "Unsigned bytes store 0–255. Signed bytes store roughly −128 to +127 using 2's complement — the standard for integer math in assembly.",
          "To get 2's complement: invert bits, then add 1. The leftmost bit indicates sign (0 = positive, 1 = negative).",
        ],
        table: {
          caption: "8-bit signed examples (2's complement)",
          headers: ["Decimal", "Binary", "Note"],
          rows: [
            ["+5", "0000 0101", "Positive — sign bit 0"],
            ["−1", "1111 1111", "All ones pattern"],
            ["−5", "1111 1011", "Invert +5, add 1"],
            ["−128", "1000 0000", "Smallest signed 8-bit value"],
          ],
        },
        realLife: {
          title: "Real-life connection",
          text: "Banking apps use signed integers for balances. If an program treats a negative balance as a huge positive number (unsigned mistake), you get overflow bugs — a classic COAL exam and interview topic.",
        },
      },
      {
        id: "ascii-bcd",
        title: "Characters: ASCII & BCD",
        body: [
          "ASCII maps characters to numbers. 'A' = 65, 'a' = 97, '0' = 48. BCD (Binary Coded Decimal) stores each decimal digit in 4 bits — used in calculators and legacy financial systems.",
        ],
        table: {
          caption: "Common ASCII codes (subset)",
          headers: ["Character", "Decimal", "Hex"],
          rows: [
            ["'0'", "48", "30"],
            ["'9'", "57", "39"],
            ["'A'", "65", "41"],
            ["'Z'", "90", "5A"],
            ["Space", "32", "20"],
            ["Newline", "10", "0A"],
          ],
        },
        realLife: {
          title: "Real-life connection",
          text: "When you press 'A' on a keyboard, the OS receives ASCII 65. Assembly string routines compare and move these numeric codes — not the letter shapes you see on screen.",
        },
      },
      {
        id: "floating-intro",
        title: "Floating-Point (Overview)",
        body: [
          "Real numbers (3.14, −0.5) use IEEE-754 format: sign bit + exponent + fraction. You will meet this in advanced COAL when handling scientific calculations.",
          "For now, remember: integers and characters have exact bit patterns; floats are approximations.",
        ],
        table: {
          caption: "Integer vs float storage (conceptual)",
          headers: ["Type", "Bits (typical)", "Example use"],
          rows: [
            ["8-bit unsigned", "8", "Pixel brightness 0–255"],
            ["32-bit signed int", "32", "Loop counters, array indexes"],
            ["32-bit float", "32", "Sensor readings, game physics"],
          ],
        },
      },
    ],
    keyTakeaways: [
      "Binary is the native language of hardware; hex is the shorthand engineers use daily.",
      "2's complement is how signed integers are stored and added in x86 assembly.",
      "Characters are just numbers (ASCII) — assembly works with those numbers directly.",
    ],
    relatedTool: {
      label: "Practice conversions interactively",
      to: "/number-systems/calculator",
    },
  },
};

function getCoalTopicContent(slug) {
  return coalTopicContent[slug] || null;
}

function getCoalTopicsWithContent() {
  return Object.keys(coalTopicContent);
}

export { coalTopicContent, getCoalTopicContent, getCoalTopicsWithContent };
export default coalTopicContent;
