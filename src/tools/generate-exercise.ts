/**
 * generate_exercise — Math/science exercises with step-by-step solutions.
 *
 * Generates exercises with hints, common mistakes, and detailed solution steps.
 */

import type {
  GenerateExerciseInput,
  ExerciseSetResult,
  Exercise,
  ExerciseStep,
  ExerciseSubject,
  DifficultyLevel,
} from "../types.js";
import {
  timestamp,
  clamp,
  requireNonEmpty,
  difficultyMultiplier,
} from "../utils/helpers.js";

// ── Exercise Templates per Subject ─────────────────────────────────────────────

interface ExerciseTemplate {
  problem: (topic: string, difficulty: DifficultyLevel) => string;
  steps: (topic: string, difficulty: DifficultyLevel) => ExerciseStep[];
  answer: (topic: string, difficulty: DifficultyLevel) => string;
  hints: (topic: string) => string[];
  mistakes: (topic: string) => string[];
  skills: string[];
}

const MATH_TEMPLATES: ExerciseTemplate[] = [
  {
    problem: (t, d) =>
      d === "easy"
        ? `Solve for x: 2x + 6 = 14. (Topic: ${t})`
        : d === "medium"
        ? `Solve for x: 3x² - 12 = 0. (Topic: ${t})`
        : `Solve for x: x³ - 6x² + 11x - 6 = 0. (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "Subtract 6 from both sides", formula: "2x + 6 - 6 = 14 - 6", result: "2x = 8" },
          { step_number: 2, description: "Divide both sides by 2", formula: "2x / 2 = 8 / 2", result: "x = 4" },
          { step_number: 3, description: "Verify: 2(4) + 6 = 8 + 6 = 14 ✓", result: "x = 4 is correct" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Add 12 to both sides", formula: "3x² = 12" },
          { step_number: 2, description: "Divide both sides by 3", formula: "x² = 4" },
          { step_number: 3, description: "Take the square root", formula: "x = ±√4", result: "x = ±2" },
          { step_number: 4, description: "Verify both solutions", result: "x = 2 and x = -2 are both correct" },
        ];
      }
      return [
        { step_number: 1, description: "Try x = 1: 1 - 6 + 11 - 6 = 0 ✓", result: "x = 1 is a root" },
        { step_number: 2, description: "Factor out (x - 1)", formula: "x³ - 6x² + 11x - 6 = (x - 1)(x² - 5x + 6)" },
        { step_number: 3, description: "Factor the quadratic", formula: "(x - 1)(x - 2)(x - 3) = 0" },
        { step_number: 4, description: "Set each factor to zero", result: "x = 1, x = 2, x = 3" },
      ];
    },
    answer: (t, d) => d === "easy" ? "x = 4" : d === "medium" ? "x = 2 or x = -2" : "x = 1, x = 2, x = 3",
    hints: (t) => [
      "Isolate the variable on one side of the equation.",
      "Perform the same operation on both sides to maintain equality.",
      "Always check your answer by substituting back into the original equation.",
    ],
    mistakes: (t) => [
      "Forgetting to perform the operation on both sides of the equation.",
      "Sign errors when moving terms across the equals sign.",
      "Not checking the solution in the original equation.",
    ],
    skills: ["Equation solving", "Algebraic manipulation", "Verification"],
  },
  {
    problem: (t, d) =>
      d === "easy"
        ? `Calculate the area of a rectangle with length 8 cm and width 5 cm. (Topic: ${t})`
        : d === "medium"
        ? `Find the area of a triangle with base 10 cm and height 7 cm. Then find its perimeter if the other two sides are 8 cm and 9 cm. (Topic: ${t})`
        : `A cylinder has radius 4 cm and height 10 cm. Calculate its volume and total surface area. (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "Recall the formula for area of a rectangle", formula: "A = length × width" },
          { step_number: 2, description: "Substitute the values", formula: "A = 8 × 5" },
          { step_number: 3, description: "Calculate", result: "A = 40 cm²" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Calculate area using triangle formula", formula: "A = ½ × base × height = ½ × 10 × 7", result: "A = 35 cm²" },
          { step_number: 2, description: "Calculate perimeter", formula: "P = 10 + 8 + 9", result: "P = 27 cm" },
        ];
      }
      return [
        { step_number: 1, description: "Calculate volume", formula: "V = πr²h = π(4)²(10) = 160π", result: "V ≈ 502.65 cm³" },
        { step_number: 2, description: "Calculate lateral surface area", formula: "A_lateral = 2πrh = 2π(4)(10) = 80π", result: "A_lateral ≈ 251.33 cm²" },
        { step_number: 3, description: "Calculate area of two circular ends", formula: "A_ends = 2πr² = 2π(16) = 32π", result: "A_ends ≈ 100.53 cm²" },
        { step_number: 4, description: "Total surface area", formula: "A_total = 80π + 32π = 112π", result: "A_total ≈ 351.86 cm²" },
      ];
    },
    answer: (t, d) => d === "easy" ? "40 cm²" : d === "medium" ? "Area = 35 cm², Perimeter = 27 cm" : "Volume ≈ 502.65 cm³, Surface Area ≈ 351.86 cm²",
    hints: (t) => [
      "Write down the relevant formula before substituting values.",
      "Keep track of units throughout your calculation.",
      "For 3D shapes, surface area has multiple components.",
    ],
    mistakes: (t) => [
      "Confusing area and perimeter formulas.",
      "Forgetting to include units in the final answer.",
      "For cylinders, forgetting to add the area of the circular ends.",
    ],
    skills: ["Geometry", "Formula application", "Unit awareness"],
  },
  {
    problem: (t, d) =>
      d === "easy"
        ? `What is 15% of 80? (Topic: ${t})`
        : d === "medium"
        ? `A store offers a 25% discount on an item originally priced at $120. After the discount, a 8% sales tax is applied. What is the final price? (Topic: ${t})`
        : `An investment of $5,000 earns compound interest at 6% per year, compounded quarterly. What is the value after 3 years? (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "Convert percentage to decimal", formula: "15% = 0.15" },
          { step_number: 2, description: "Multiply", formula: "0.15 × 80 = 12", result: "15% of 80 = 12" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Calculate discount amount", formula: "120 × 0.25 = $30" },
          { step_number: 2, description: "Subtract discount", formula: "120 - 30 = $90" },
          { step_number: 3, description: "Calculate tax", formula: "90 × 0.08 = $7.20" },
          { step_number: 4, description: "Add tax to discounted price", formula: "90 + 7.20 = $97.20", result: "Final price = $97.20" },
        ];
      }
      return [
        { step_number: 1, description: "Identify compound interest formula", formula: "A = P(1 + r/n)^(nt)" },
        { step_number: 2, description: "Substitute values: P=5000, r=0.06, n=4, t=3", formula: "A = 5000(1 + 0.06/4)^(4×3)" },
        { step_number: 3, description: "Simplify inside parentheses", formula: "A = 5000(1.015)^12" },
        { step_number: 4, description: "Calculate", formula: "A = 5000 × 1.19562", result: "A ≈ $5,978.09" },
      ];
    },
    answer: (t, d) => d === "easy" ? "12" : d === "medium" ? "$97.20" : "≈ $5,978.09",
    hints: (t) => [
      "Convert percentages to decimals by dividing by 100.",
      "Apply operations in the correct order (discount first, then tax).",
      "For compound interest, identify all four variables: P, r, n, t.",
    ],
    mistakes: (t) => [
      "Applying tax before the discount instead of after.",
      "Confusing simple and compound interest formulas.",
      "Rounding intermediate steps, which accumulates error in the final answer.",
    ],
    skills: ["Percentages", "Multi-step calculations", "Financial mathematics"],
  },
];

const PHYSICS_TEMPLATES: ExerciseTemplate[] = [
  {
    problem: (t, d) =>
      d === "easy"
        ? `A car travels 150 km in 2.5 hours at constant speed. What is its average speed? (Topic: ${t})`
        : d === "medium"
        ? `An object is dropped from a height of 45 m. How long does it take to reach the ground? (Use g = 9.8 m/s²) (Topic: ${t})`
        : `A projectile is launched at 30 m/s at an angle of 45°. Calculate its maximum height and range. (Use g = 9.8 m/s²) (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "Use the speed formula", formula: "v = d / t" },
          { step_number: 2, description: "Substitute values", formula: "v = 150 / 2.5", result: "v = 60 km/h" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Use free fall equation", formula: "h = ½gt²" },
          { step_number: 2, description: "Solve for t", formula: "t = √(2h/g) = √(2×45/9.8)" },
          { step_number: 3, description: "Calculate", result: "t ≈ 3.03 seconds" },
        ];
      }
      return [
        { step_number: 1, description: "Find vertical component", formula: "v_y = 30 × sin(45°) = 21.21 m/s" },
        { step_number: 2, description: "Find horizontal component", formula: "v_x = 30 × cos(45°) = 21.21 m/s" },
        { step_number: 3, description: "Maximum height", formula: "H = v_y² / (2g) = 21.21² / (2×9.8)", result: "H ≈ 22.96 m" },
        { step_number: 4, description: "Time of flight", formula: "T = 2v_y / g = 2(21.21) / 9.8 ≈ 4.33 s" },
        { step_number: 5, description: "Range", formula: "R = v_x × T = 21.21 × 4.33", result: "R ≈ 91.84 m" },
      ];
    },
    answer: (t, d) => d === "easy" ? "60 km/h" : d === "medium" ? "≈ 3.03 seconds" : "Max height ≈ 22.96 m, Range ≈ 91.84 m",
    hints: (t) => [
      "Write down the known and unknown quantities first.",
      "Choose the right kinematic equation based on what you know and what you need.",
      "Check that your units are consistent throughout.",
    ],
    mistakes: (t) => [
      "Mixing up units (km with m, hours with seconds).",
      "Forgetting that g is acceleration, not velocity.",
      "Not decomposing velocity into components for projectile problems.",
    ],
    skills: ["Kinematics", "Unit conversion", "Vector decomposition"],
  },
];

const CHEMISTRY_TEMPLATES: ExerciseTemplate[] = [
  {
    problem: (t, d) =>
      d === "easy"
        ? `Balance the equation: H₂ + O₂ → H₂O. (Topic: ${t})`
        : d === "medium"
        ? `How many moles of CO₂ are produced when 2 moles of C₂H₆ undergo complete combustion? (Topic: ${t})`
        : `Calculate the pH of a 0.01 M HCl solution. Then find the pOH and [OH⁻]. (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "Count atoms on each side: H₂ + O₂ → H₂O gives H:2,O:2 → H:2,O:1" },
          { step_number: 2, description: "Balance oxygen by placing coefficient 2 before H₂O", formula: "H₂ + O₂ → 2H₂O" },
          { step_number: 3, description: "Now H:2,O:2 → H:4,O:2. Balance H with coefficient 2 before H₂", formula: "2H₂ + O₂ → 2H₂O", result: "Balanced!" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Write balanced combustion equation", formula: "2C₂H₆ + 7O₂ → 4CO₂ + 6H₂O" },
          { step_number: 2, description: "Read mole ratio from coefficients: 2 mol C₂H₆ produces 4 mol CO₂" },
          { step_number: 3, description: "For 2 mol C₂H₆", result: "4 moles of CO₂ are produced" },
        ];
      }
      return [
        { step_number: 1, description: "HCl is a strong acid — fully dissociates", formula: "[H⁺] = 0.01 M" },
        { step_number: 2, description: "Calculate pH", formula: "pH = -log(0.01) = -log(10⁻²) = 2" },
        { step_number: 3, description: "Calculate pOH", formula: "pOH = 14 - pH = 14 - 2 = 12" },
        { step_number: 4, description: "Calculate [OH⁻]", formula: "[OH⁻] = 10⁻¹² M", result: "pH = 2, pOH = 12, [OH⁻] = 10⁻¹² M" },
      ];
    },
    answer: (t, d) => d === "easy" ? "2H₂ + O₂ → 2H₂O" : d === "medium" ? "4 moles of CO₂" : "pH = 2, pOH = 12, [OH⁻] = 10⁻¹² M",
    hints: (t) => [
      "Count each type of atom on both sides of the equation.",
      "Use mole ratios from balanced equations for stoichiometry.",
      "Remember: pH + pOH = 14 at 25°C.",
    ],
    mistakes: (t) => [
      "Changing subscripts instead of coefficients when balancing.",
      "Forgetting to balance all atom types.",
      "Confusing strong acids (full dissociation) with weak acids (partial dissociation).",
    ],
    skills: ["Balancing equations", "Stoichiometry", "Acid-base chemistry"],
  },
];

const BIOLOGY_TEMPLATES: ExerciseTemplate[] = [
  {
    problem: (t, d) =>
      d === "easy"
        ? `Name the four bases found in DNA and their pairing rules. (Topic: ${t})`
        : d === "medium"
        ? `If a DNA strand has the sequence 5'-ATCGGCTA-3', what is the complementary strand? What would the mRNA sequence be? (Topic: ${t})`
        : `A gene has 900 base pairs. How many amino acids will the resulting protein have? Account for the start and stop codons. (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "The four DNA bases are: Adenine (A), Thymine (T), Guanine (G), Cytosine (C)" },
          { step_number: 2, description: "Pairing rules: A pairs with T, G pairs with C", result: "A-T and G-C" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Apply complementary base pairing (A-T, G-C)", formula: "5'-ATCGGCTA-3' → 3'-TAGCCGAT-5'" },
          { step_number: 2, description: "For mRNA, use the template strand and replace T with U", formula: "mRNA: 5'-AUCGGCUA-3'" },
        ];
      }
      return [
        { step_number: 1, description: "900 base pairs = 900 nucleotides in mRNA" },
        { step_number: 2, description: "Each codon = 3 nucleotides", formula: "900 / 3 = 300 codons" },
        { step_number: 3, description: "Subtract 1 stop codon (not translated to amino acid)", formula: "300 - 1 = 299" },
        { step_number: 4, description: "The start codon (AUG) codes for methionine and IS counted", result: "299 amino acids (including the initial methionine)" },
      ];
    },
    answer: (t, d) => d === "easy" ? "A-T, G-C (Adenine-Thymine, Guanine-Cytosine)" : d === "medium" ? "Complement: 3'-TAGCCGAT-5', mRNA: 5'-AUCGGCUA-3'" : "299 amino acids",
    hints: (t) => [
      "Remember: A pairs with T (DNA) or U (RNA), G pairs with C.",
      "mRNA is synthesized from the template (antisense) strand.",
      "Every three nucleotides form one codon; the stop codon doesn't code for an amino acid.",
    ],
    mistakes: (t) => [
      "Confusing the template strand with the coding strand.",
      "Forgetting to replace T with U when writing mRNA.",
      "Including the stop codon in the amino acid count.",
    ],
    skills: ["DNA structure", "Transcription", "Translation"],
  },
];

const CS_TEMPLATES: ExerciseTemplate[] = [
  {
    problem: (t, d) =>
      d === "easy"
        ? `Convert the decimal number 42 to binary. (Topic: ${t})`
        : d === "medium"
        ? `What is the time complexity of binary search? Explain why. (Topic: ${t})`
        : `Given an array [3, 1, 4, 1, 5, 9, 2, 6], trace through the merge sort algorithm and show each step. (Topic: ${t})`,
    steps: (t, d) => {
      if (d === "easy") {
        return [
          { step_number: 1, description: "42 ÷ 2 = 21 remainder 0" },
          { step_number: 2, description: "21 ÷ 2 = 10 remainder 1" },
          { step_number: 3, description: "10 ÷ 2 = 5 remainder 0" },
          { step_number: 4, description: "5 ÷ 2 = 2 remainder 1" },
          { step_number: 5, description: "2 ÷ 2 = 1 remainder 0" },
          { step_number: 6, description: "1 ÷ 2 = 0 remainder 1" },
          { step_number: 7, description: "Read remainders bottom to top", result: "42 in binary = 101010" },
        ];
      }
      if (d === "medium") {
        return [
          { step_number: 1, description: "Binary search halves the search space each step" },
          { step_number: 2, description: "After 1 step: n/2 elements. After 2 steps: n/4. After k steps: n/2^k" },
          { step_number: 3, description: "Search ends when n/2^k = 1, so k = log₂(n)", result: "Time complexity: O(log n)" },
        ];
      }
      return [
        { step_number: 1, description: "Split: [3,1,4,1] and [5,9,2,6]" },
        { step_number: 2, description: "Split: [3,1] [4,1] [5,9] [2,6]" },
        { step_number: 3, description: "Split: [3] [1] [4] [1] [5] [9] [2] [6]" },
        { step_number: 4, description: "Merge pairs: [1,3] [1,4] [5,9] [2,6]" },
        { step_number: 5, description: "Merge pairs: [1,1,3,4] [2,5,6,9]" },
        { step_number: 6, description: "Final merge", result: "[1,1,2,3,4,5,6,9]" },
      ];
    },
    answer: (t, d) => d === "easy" ? "101010" : d === "medium" ? "O(log n)" : "[1, 1, 2, 3, 4, 5, 6, 9]",
    hints: (t) => [
      "For binary conversion, repeatedly divide by 2 and track remainders.",
      "For complexity analysis, think about how the problem size changes at each step.",
      "Merge sort always splits first, then merges in sorted order.",
    ],
    mistakes: (t) => [
      "Reading binary remainders in the wrong order (top-to-bottom instead of bottom-to-top).",
      "Confusing O(n) with O(log n) for halving algorithms.",
      "Not maintaining sorted order during the merge step.",
    ],
    skills: ["Number systems", "Algorithm analysis", "Sorting algorithms"],
  },
];

const SUBJECT_TEMPLATES: Record<ExerciseSubject, ExerciseTemplate[]> = {
  math: MATH_TEMPLATES,
  physics: PHYSICS_TEMPLATES,
  chemistry: CHEMISTRY_TEMPLATES,
  biology: BIOLOGY_TEMPLATES,
  computer_science: CS_TEMPLATES,
};

// ── Main ───────────────────────────────────────────────────────────────────────

export function generateExercise(input: GenerateExerciseInput): ExerciseSetResult {
  const topic = requireNonEmpty(input.topic, "topic");
  const subject = input.subject;
  const exerciseCount = clamp(input.exercise_count ?? 3, 1, 20);
  const difficulty = input.difficulty ?? "medium";
  const includeHints = input.include_hints ?? true;
  const showSteps = input.show_steps ?? true;

  const templates = SUBJECT_TEMPLATES[subject];
  if (!templates || templates.length === 0) {
    throw new Error(`No exercise templates available for subject: ${subject}`);
  }

  const exercises: Exercise[] = [];
  for (let i = 0; i < exerciseCount; i++) {
    const tpl = templates[i % templates.length];
    const steps = showSteps ? tpl.steps(topic, difficulty) : [];
    const exercise: Exercise = {
      id: i + 1,
      problem: tpl.problem(topic, difficulty),
      subject,
      difficulty,
      solution: {
        steps,
        final_answer: tpl.answer(topic, difficulty),
      },
      hints: includeHints ? tpl.hints(topic) : [],
      common_mistakes: tpl.mistakes(topic),
    };
    exercises.push(exercise);
  }

  // Collect all unique skills
  const allSkills = new Set<string>();
  for (let i = 0; i < exerciseCount; i++) {
    const tpl = templates[i % templates.length];
    tpl.skills.forEach((s) => allSkills.add(s));
  }

  const estimatedMinutes = Math.ceil(exerciseCount * 5 * difficultyMultiplier(difficulty));

  return {
    topic,
    subject,
    exercise_count: exercises.length,
    exercises,
    metadata: {
      generated_at: timestamp(),
      estimated_completion_minutes: estimatedMinutes,
      skills_practiced: Array.from(allSkills),
    },
  };
}
