export interface MathResource {
  id: string;
  title: string;
  grade: 'Class 5' | 'Class 6' | 'Class 7' | 'Class 8' | 'Class 9' | 'Class 10';
  isBoardExam?: boolean;
  topic: 'Real Numbers' | 'Polynomials' | 'Linear Equations' | 'Triangles & Geometry' | 'Trigonometry' | 'Mensuration 2D/3D' | 'Statistics & Probability' | 'Fractions & Decimals';
  categoryTitle: string;
  tier: 'free' | 'pro';
  format: 'Handwritten Notes' | 'Formula Sheets (1-Pager)' | 'Video Lessons' | 'NCERT Exemplar Solutions' | 'Crash Courses';
  description: string;
  rating: number;
  downloadsCount: string;
  sizeOrDuration: string;
  pageCount?: string;
  price?: number;
  originalPrice?: number;
  enrolledCount?: string;
  badgeLabel?: string;
  hasVideo?: boolean;
  videoDuration?: string;
  thumbnailUrl?: string;
  youtubeId?: string;
  facebookVideoUrl?: string;
  videoUrl?: string;
  videoPlatform?: 'youtube' | 'facebook' | 'direct';
  embedHtml?: string;
  downloadUrl?: string;
  flashcardCount?: number;
  keyFormulas?: string[];
  examTraps?: string[];
  tags: string[];
}

export const MATH_RESOURCES: MathResource[] = [
  {
    id: 'res-poly-class9',
    title: 'Polynomials & Algebraic Identities Formula Sheet',
    grade: 'Class 9',
    topic: 'Polynomials',
    categoryTitle: 'Algebra • 1-Page Cheat Sheet',
    tier: 'free',
    format: 'Formula Sheets (1-Pager)',
    description: 'Every standard identity (a+b+c)², (a³+b³), factor theorem shortcuts, and 12 typical board examination trap questions.',
    rating: 4.9,
    downloadsCount: '12.4k',
    sizeOrDuration: '2.4 MB • Single Sheet',
    pageCount: '1 Page',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Algebra', 'Identities', 'CBSE Class 9', 'NCERT Solutions'],
    keyFormulas: [
      '(a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca',
      'a³ + b³ + c³ - 3abc = (a + b + c)(a² + b² + c² - ab - bc - ca)',
      'If a + b + c = 0, then a³ + b³ + c³ = 3abc',
      'x³ + y³ = (x + y)(x² - xy + y²)',
      'x³ - y³ = (x - y)(x² + xy + y²)'
    ],
    examTraps: [
      'Don\'t forget cross-terms when expanding (x - 2y + 3z)²',
      'In Factor Theorem: if P(a) = 0, (x - a) is a factor, not (x + a)',
      'Watch signs in (a - b)³ = a³ - 3a²b + 3ab² - b³'
    ]
  },
  {
    id: 'res-trig-class10',
    title: 'Trigonometry Super Mastery Booklet + Video Explanations',
    grade: 'Class 10',
    isBoardExam: true,
    topic: 'Trigonometry',
    categoryTitle: 'Trigonometry • Complete Kit',
    tier: 'pro',
    format: 'Crash Courses',
    description: '60-page curated question bank, heights & distances real-world proof methods, plus 4K video breakdowns of the 25 hardest NCERT Exemplars.',
    rating: 4.95,
    downloadsCount: '5.2k',
    sizeOrDuration: '60 Pages • 4K Video Library',
    price: 199,
    originalPrice: 599,
    enrolledCount: '5.2k enrolled',
    badgeLabel: 'PRO MASTERCLASS',
    tags: ['Class 10 Board', 'Trigonometric Ratios', 'Identities', 'Heights & Distances'],
    keyFormulas: [
      'sin²θ + cos²θ = 1',
      '1 + tan²θ = sec²θ',
      '1 + cot²θ = cosec²θ',
      'sin(90° - θ) = cos θ; tan(90° - θ) = cot θ',
      'Height h = d · tan θ (Single observer landmark formula)'
    ],
    examTraps: [
      'Angle of elevation is always measured from the horizontal line of sight upwards',
      'Never divide by sin θ without verifying sin θ ≠ 0'
    ]
  },
  {
    id: 'res-mens-class8',
    title: 'Mensuration & Surface Areas - Step-by-Step Solved Cheat-Sheet',
    grade: 'Class 8',
    topic: 'Mensuration 2D/3D',
    categoryTitle: 'Mensuration • Visual Guide',
    tier: 'free',
    format: 'Handwritten Notes',
    description: '3D cylinders, cones, and cuboids unrolled with net-diagram illustrations. Never mix Lateral Surface Area with Total Surface Area again.',
    rating: 4.8,
    downloadsCount: '8.7k',
    sizeOrDuration: '1.8 MB • High-Res Vector PDF',
    pageCount: '4 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Surface Area', 'Volume', '3D Nets', 'Cylinders & Cones'],
    keyFormulas: [
      'Cylinder CSA = 2πrh | TSA = 2πr(r + h) | Vol = πr²h',
      'Cone Slant Height l = √(r² + h²) | CSA = πrl | TSA = πr(l + r)',
      'Cuboid TSA = 2(lb + bh + hl) | Diagonal = √(l² + b² + h²)',
      'Sphere TSA = 4πr² | Volume = 4/3 πr³',
      'Hemisphere CSA = 2πr² | TSA = 3πr² | Vol = 2/3 πr³'
    ],
    examTraps: [
      'Total surface area of an open cylinder has only one circular base: 2πrh + πr²',
      'Hollow cylinder thickness: Outer volume minus inner volume π(R² - r²)h'
    ]
  },
  {
    id: 'res-geom-video-class9',
    title: 'Complete Class 9 Geometry Course + Theorem Vault',
    grade: 'Class 9',
    topic: 'Triangles & Geometry',
    categoryTitle: 'Geometry • 50 Solved Theorems',
    tier: 'pro',
    format: 'Video Lessons',
    description: 'Lines, Angles, Triangles Congruency (SAS, ASA, RHS), and Circles step-by-step logic builders explained in crisp animations.',
    rating: 4.9,
    downloadsCount: '15.8k',
    sizeOrDuration: '3.5 Hrs Video • 50 Interactive Proofs',
    price: 349,
    originalPrice: 899,
    hasVideo: true,
    videoDuration: '3.5 Hrs Video',
    videoPlatform: 'youtube',
    youtubeId: 'kJQP7kiw5Fk',
    thumbnailUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZtxWXovBQ43fDotyNVe9ZDaWWCvGpkkQl4Tn5qW2jNzVl0l1EMnJQM8Ss6FACQs9Mi0l_L4hHH49EcHsH3upcN3IDVJRicOwlyxL40z4PbSkkvqhgrzlIV7s9M8yOTvL4XA7gXS45fQG9KnWtNh-JW8qsZbokBuGh9ClIT0_93EBQLjO07aVAMAb2QDlRFJe0RHqRC6Z5fpGHdVIq7IqHsjf8UbTS5ak0KLJ6jye5D0gp7wZxp7Ru',
    badgeLabel: 'VIDEO MASTERCLASS',
    tags: ['Class 9 Geometry', 'Triangles', 'Circles', 'Theorems & Proofs'],
    keyFormulas: [
      'Angle Sum Property: In any triangle, ∠A + ∠B + ∠C = 180°',
      'Exterior Angle Theorem: Exterior angle = Sum of two interior opposite angles',
      'SAS, ASA, AAS, SSS, RHS Congruence criteria conditions',
      'Circles: Angle subtended at centre is twice angle at circumference'
    ]
  },
  {
    id: 'res-fb-video-trig-class10',
    title: 'Class 10 Trigonometry 1-Shot Visual Masterclass (Facebook Live)',
    grade: 'Class 10',
    topic: 'Trigonometry',
    categoryTitle: 'Trigonometry • Facebook Embedded Lesson',
    tier: 'free',
    format: 'Video Lessons',
    description: 'Complete high-yield walkthrough of sin², cos², tan ratios, standard angle tricks (0° to 90° table memorization), and board exam proofs.',
    rating: 5.0,
    downloadsCount: '19.4k',
    sizeOrDuration: '45 mins • Facebook Embedded Player',
    hasVideo: true,
    videoDuration: '45 mins',
    videoPlatform: 'facebook',
    facebookVideoUrl: 'https://www.facebook.com/facebook/videos/10153231379946729/',
    badgeLabel: 'FACEBOOK VIDEO EMBED',
    tags: ['Class 10', 'Trigonometry', 'Facebook Video', 'NCERT Solutions', 'Board Exam 2026'],
    keyFormulas: [
      'sin²θ + cos²θ = 1',
      '1 + tan²θ = sec²θ',
      '1 + cot²θ = cosec²θ',
      'tanθ = sinθ / cosθ'
    ]
  },
  {
    id: 'res-yt-video-poly-class10',
    title: 'Quadratic Equations & Roots Decomposition in 15 Minutes',
    grade: 'Class 10',
    topic: 'Polynomials',
    categoryTitle: 'Algebra • YouTube Embedded Lesson',
    tier: 'free',
    format: 'Video Lessons',
    description: 'Visual geometric breakdown of completing the square and the Shreedharacharya quadratic discriminant D = b² - 4ac method.',
    rating: 4.9,
    downloadsCount: '14.2k',
    sizeOrDuration: '18 mins • YouTube HD',
    hasVideo: true,
    videoDuration: '18 mins',
    videoPlatform: 'youtube',
    youtubeId: 'kJQP7kiw5Fk',
    badgeLabel: 'YOUTUBE HD EMBED',
    tags: ['Class 10', 'Quadratic Equations', 'YouTube Video', 'Board Exam 2026'],
    keyFormulas: [
      'Standard Form: ax² + bx + c = 0',
      'Discriminant: D = b² - 4ac',
      'Quadratic Formula: x = (-b ± √D) / (2a)',
      'Nature of Roots: D > 0 distinct real, D = 0 equal real, D < 0 no real roots'
    ]
  },
  {
    id: 'res-frac-flash-class7',
    title: 'Fractions & Decimals Quick Revision Flashcards',
    grade: 'Class 7',
    topic: 'Fractions & Decimals',
    categoryTitle: 'Number Logic • Printable Kit',
    tier: 'free',
    format: 'Formula Sheets (1-Pager)',
    description: 'Printable double-sided flashcards to master reciprocal division, mixed fractions, recurring decimals, and unit conversions.',
    rating: 4.8,
    downloadsCount: '10.1k',
    sizeOrDuration: '36 Color Flashcards • A4 Ready',
    flashcardCount: 36,
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Class 7', 'Fractions', 'Decimals', 'Flashcards', 'Printable'],
    keyFormulas: [
      'Division: a/b ÷ c/d = a/b × d/c (Keep, Change, Flip)',
      'Mixed to Improper: a b/c = (a × c + b) / c',
      'Decimals to Fractions: 0.25 = 25/100 = 1/4; 0.125 = 1/8',
      'Recurring shortcut: 0.333... = 1/3; 0.666... = 2/3'
    ]
  },
  {
    id: 'res-quad-class10',
    title: 'Quadratic Equations Board Exam Special Notes',
    grade: 'Class 10',
    isBoardExam: true,
    topic: 'Polynomials',
    categoryTitle: 'Class 10 • High Yield Notes',
    tier: 'free',
    format: 'Handwritten Notes',
    description: 'Discriminant (D = b² - 4ac) analysis tables, roots nature decision tree, word problem translations (speed-distance & pipes), and previous 10-year questions.',
    rating: 4.92,
    downloadsCount: '19.3k',
    sizeOrDuration: '14 Pages • Free PDF',
    pageCount: '14 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Board Exam 2025', 'Discriminant D', 'Quadratic Formula', 'Word Problems'],
    keyFormulas: [
      'Standard Form: ax² + bx + c = 0 (a ≠ 0)',
      'Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)',
      'Discriminant D = b² - 4ac',
      'D > 0: Two distinct real roots | D = 0: Two equal real roots (-b/2a) | D < 0: No real roots'
    ]
  },
  // Additional comprehensive resources for class 5, 6, 8, etc.
  {
    id: 'res-num-class5',
    title: 'Numbers, Roman Numerals & Large Digits Illustrated Cheat Sheet',
    grade: 'Class 5',
    topic: 'Real Numbers',
    categoryTitle: 'Foundations • Visual Deck',
    tier: 'free',
    format: 'Formula Sheets (1-Pager)',
    description: 'Place value tables (Indian vs International system), Roman numerals conversion mnemonics (I, V, X, L, C, D, M), and BODMAS rules.',
    rating: 4.85,
    downloadsCount: '7.8k',
    sizeOrDuration: '1.5 MB • PDF',
    pageCount: '2 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Class 5', 'Place Value', 'Roman Numerals', 'BODMAS'],
    keyFormulas: [
      '1 Million = 10 Lakhs | 10 Million = 1 Crore',
      'Roman values: I=1, V=5, X=10, L=50, C=100, D=500, M=1000',
      'BODMAS: Brackets, Orders/Of, Division, Multiplication, Addition, Subtraction'
    ]
  },
  {
    id: 'res-int-class6',
    title: 'Integers, Number Line & Basic Algebra Starter Pack',
    grade: 'Class 6',
    topic: 'Real Numbers',
    categoryTitle: 'Number Line & Signs • Solved Guide',
    tier: 'free',
    format: 'Handwritten Notes',
    description: 'Signed addition & subtraction rules visualizer on a color-coded number line. Never stumble on (-4) - (-7) again.',
    rating: 4.78,
    downloadsCount: '9.4k',
    sizeOrDuration: '2.1 MB • PDF',
    pageCount: '6 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Class 6', 'Integers', 'Number Line', 'Sign Rules'],
    keyFormulas: [
      '(+) × (+) = (+); (-) × (-) = (+); (+) × (-) = (-)',
      'Subtracting a negative is equivalent to adding: a - (-b) = a + b',
      'Absolute Value: |-x| = x'
    ]
  },
  {
    id: 'res-linear-class9',
    title: 'Linear Equations in Two Variables & Cartesian Graphs',
    grade: 'Class 9',
    topic: 'Linear Equations',
    categoryTitle: 'Algebra • Graphical Analysis',
    tier: 'free',
    format: 'NCERT Exemplar Solutions',
    description: 'Finding infinitely many solutions, plotting lines parallel to X and Y axes, and converting practical daily problems into ax + by + c = 0.',
    rating: 4.88,
    downloadsCount: '11.3k',
    sizeOrDuration: '3.2 MB • PDF',
    pageCount: '8 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Class 9', 'Linear Equations', 'Graph Plotting', 'Exemplar'],
    keyFormulas: [
      'General Form: ax + by + c = 0 (a, b not both 0)',
      'Line parallel to Y-axis: x = a | Line parallel to X-axis: y = b',
      'Equation of X-axis: y = 0 | Equation of Y-axis: x = 0'
    ]
  },
  {
    id: 'res-stat-class10',
    title: 'Statistics & Probability Formula Deck + Step-by-Step Median Trick',
    grade: 'Class 10',
    isBoardExam: true,
    topic: 'Statistics & Probability',
    categoryTitle: 'Board Exam • High Scoring Section',
    tier: 'free',
    format: 'Formula Sheets (1-Pager)',
    description: 'Grouped data Mean (Direct, Assumed Mean, Step Deviation), Mode and Median formulas with Ogive curve guidelines and playing cards breakdown.',
    rating: 4.94,
    downloadsCount: '16.7k',
    sizeOrDuration: '2.8 MB • PDF',
    pageCount: '3 Pages',
    badgeLabel: 'FREE DOWNLOAD',
    tags: ['Class 10 Board', 'Statistics', 'Probability', 'Mean Median Mode'],
    keyFormulas: [
      'Empirical Formula: 3 Median = Mode + 2 Mean',
      'Mean (Direct): x̄ = Σ(fᵢxᵢ) / Σfᵢ',
      'Median = l + [ (N/2 - cf) / f ] × h',
      'Mode = l + [ (f₁ - f₀) / (2f₁ - f₀ - f₂) ] × h',
      'Probability P(E) = Number of favourable outcomes / Total outcomes'
    ]
  }
];

export interface Flashcard {
  id: number;
  question: string;
  category: string;
  answer: string;
  tip: string;
  illustrationType: 'fraction-division' | 'recurring-decimal' | 'mixed-fraction' | 'percentage-decimal' | 'cross-multiplication';
}

export const FLASHCARDS_LIST: Flashcard[] = [
  {
    id: 1,
    category: 'Fraction Division',
    question: 'How do you divide 3/4 by 5/8?',
    answer: '3/4 ÷ 5/8 = 3/4 × 8/5 = 24/20 = 6/5 = 1 1/5',
    tip: 'Rule: Keep the 1st fraction, Change ÷ to ×, Flip the 2nd fraction (Reciprocal)!',
    illustrationType: 'fraction-division'
  },
  {
    id: 2,
    category: 'Recurring Decimals',
    question: 'Convert recurring decimal 0.333... (0.3̄) into a fraction',
    answer: 'Let x = 0.333... → 10x = 3.333... → 9x = 3 → x = 3/9 = 1/3',
    tip: 'Shortcut: Put the repeating digit over 9! E.g. 0.7̄ = 7/9, 0.45̄ = 45/99 = 5/11',
    illustrationType: 'recurring-decimal'
  },
  {
    id: 3,
    category: 'Mixed Fractions',
    question: 'How do you convert 4 3/7 to an improper fraction?',
    answer: '(4 × 7 + 3) / 7 = (28 + 3) / 7 = 31/7',
    tip: 'Multiply Whole Number by Denominator, add Numerator, keep the Denominator.',
    illustrationType: 'mixed-fraction'
  },
  {
    id: 4,
    category: 'Decimals to Percentages',
    question: 'Convert 0.375 into a percentage and simplest fraction',
    answer: 'Percentage: 0.375 × 100% = 37.5% | Fraction: 375/1000 = 3/8',
    tip: 'Move decimal point 2 steps right for %; remember 1/8 = 0.125, so 3/8 = 0.375',
    illustrationType: 'percentage-decimal'
  },
  {
    id: 5,
    category: 'Comparing Fractions',
    question: 'Which is larger: 5/7 or 7/9?',
    answer: 'Cross-multiply: 5 × 9 = 45 and 7 × 7 = 49. Since 49 > 45, 7/9 > 5/7!',
    tip: 'Butterfly method: Multiply numerator of one with denominator of the other!',
    illustrationType: 'cross-multiplication'
  },
  {
    id: 6,
    category: 'Decimal Multiplication',
    question: 'Calculate 0.04 × 0.003 in seconds without scratch paper',
    answer: '4 × 3 = 12. Total decimal places = 2 + 3 = 5. Result: 0.00012',
    tip: 'Ignore decimal places first, multiply digits, then count total decimal places from right!',
    illustrationType: 'percentage-decimal'
  }
];
