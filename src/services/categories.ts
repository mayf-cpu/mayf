// Categories and Taxonomy Management Service

export type CategoryType = 'grade' | 'format' | 'topic' | 'stream';

export interface CategoryItem {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  parentId?: string | null; // ID of parent category if this is a child/sub-category
  count?: string;
  badge?: string;
  color?: string;
  description?: string;
  order: number;
  enabled: boolean;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // Grades / Classes
  {
    id: 'cat-grade-5',
    name: 'Class 5',
    type: 'grade',
    icon: 'toys',
    count: '4.8k',
    badge: 'Primary Foundation',
    color: '#3b82f6',
    description: 'Fundamental fractions, decimals, basic geometric shapes & operations.',
    order: 1,
    enabled: true,
  },
  {
    id: 'cat-grade-6',
    name: 'Class 6',
    type: 'grade',
    icon: 'shapes',
    count: '6.1k',
    badge: 'Middle School',
    color: '#6366f1',
    description: 'Integers, algebra basics, ratio & proportions, and symmetry.',
    order: 2,
    enabled: true,
  },
  {
    id: 'cat-grade-7',
    name: 'Class 7',
    type: 'grade',
    icon: 'calculate',
    count: '8.4k',
    badge: 'Middle School',
    color: '#8b5cf6',
    description: 'Lines and angles, rational numbers, triangle properties & congruence.',
    order: 3,
    enabled: true,
  },
  {
    id: 'cat-grade-8',
    name: 'Class 8',
    type: 'grade',
    icon: 'pie_chart',
    count: '11.2k',
    badge: 'High School Base',
    color: '#ec4899',
    description: 'Linear equations, exponents, algebraic expressions, factorisation & mensuration.',
    order: 4,
    enabled: true,
  },
  {
    id: 'cat-grade-9',
    name: 'Class 9',
    type: 'grade',
    icon: 'verified',
    count: '18.5k students',
    badge: 'Active CBSE Term',
    color: '#004ac6',
    description: 'Number systems, polynomials, coordinate geometry, Euclid, and Heron’s formula.',
    order: 5,
    enabled: true,
  },
  {
    id: 'cat-grade-10',
    name: 'Class 10',
    type: 'grade',
    icon: 'military_tech',
    count: '24k',
    badge: 'Board Prep 2026',
    color: '#dc2626',
    description: 'Real numbers, trigonometry, triangles, statistics, and surface areas.',
    order: 6,
    enabled: true,
  },
  {
    id: 'cat-grade-11',
    name: 'Class 11',
    type: 'grade',
    icon: 'functions',
    count: '7.5k',
    badge: 'Senior Prep',
    color: '#059669',
    description: 'Sets, relations, trigonometric functions, limits & derivatives.',
    order: 7,
    enabled: true,
  },
  {
    id: 'cat-grade-12',
    name: 'Class 12',
    type: 'grade',
    icon: 'school',
    count: '9.8k',
    badge: 'Board & CUET',
    color: '#d97706',
    description: 'Calculus, matrices, integrals, vector algebra & 3D geometry.',
    order: 8,
    enabled: true,
  },

  // Resource Formats
  {
    id: 'cat-fmt-notes',
    name: 'Handwritten Notes',
    type: 'format',
    icon: 'edit_note',
    count: '38 files',
    badge: 'Teacher Verified',
    color: '#0284c7',
    description: 'Digitized handwritten notes with visual margin callouts & solved examples.',
    order: 1,
    enabled: true,
  },
  {
    id: 'cat-fmt-sheets',
    name: 'Formula Sheets (1-Pager)',
    type: 'format',
    icon: 'description',
    count: '24 sheets',
    badge: '2-Min Revision',
    color: '#004ac6',
    description: 'Ultra-dense laminated-style 1-page formula summaries and trap warnings.',
    order: 2,
    enabled: true,
  },
  {
    id: 'cat-fmt-videos',
    name: 'Video Lessons (YouTube & Facebook)',
    type: 'format',
    icon: 'smart_display',
    count: '42 lessons',
    badge: 'Embedded Player',
    color: '#dc2626',
    description: 'Embedded YouTube lectures and Facebook videos with interactive chapter controls & accompanying study sheets.',
    order: 3,
    enabled: true,
  },
  {
    id: 'cat-fmt-ncert',
    name: 'NCERT Exemplar Solutions',
    type: 'format',
    icon: 'menu_book',
    count: '55 chapters',
    badge: 'Exemplar',
    color: '#16a34a',
    description: 'Step-by-step rigorous proofs for higher order thinking skill (HOTS) questions.',
    order: 4,
    enabled: true,
  },
  {
    id: 'cat-fmt-crash',
    name: 'Crash Courses',
    type: 'format',
    icon: 'bolt',
    count: '12 batches',
    badge: 'Sprint Prep',
    color: '#ea580c',
    description: '30-day pre-board sprint schedules with daily formula drills.',
    order: 5,
    enabled: true,
  },
  {
    id: 'cat-fmt-mindmaps',
    name: 'Mind Maps & Diagrams',
    type: 'format',
    icon: 'account_tree',
    count: '16 maps',
    badge: 'Visual Memory',
    color: '#7c3aed',
    description: 'Single-glance hierarchical concept maps linking formulas to applications.',
    order: 6,
    enabled: true,
  },

  // Math Topics
  {
    id: 'cat-top-real',
    name: 'Real Numbers',
    type: 'topic',
    parentId: 'cat-grade-10',
    icon: 'filter_1',
    badge: 'Number Theory',
    color: '#0284c7',
    description: 'Fundamental Theorem of Arithmetic, irrationality proofs, HCF/LCM relations.',
    order: 1,
    enabled: true,
  },
  {
    id: 'cat-top-poly',
    name: 'Polynomials',
    type: 'topic',
    parentId: 'cat-grade-9',
    icon: 'functions',
    badge: 'Algebra',
    color: '#2563eb',
    description: 'Zeros of polynomial, relationship with coefficients, division algorithm.',
    order: 2,
    enabled: true,
  },
  {
    id: 'cat-top-linear',
    name: 'Linear Equations',
    type: 'topic',
    parentId: 'cat-grade-9',
    icon: 'stacked_line_chart',
    badge: 'Algebra',
    color: '#4f46e5',
    description: 'Pairs of linear equations in two variables, graphical & algebraic methods.',
    order: 3,
    enabled: true,
  },
  {
    id: 'cat-top-geom',
    name: 'Triangles & Geometry',
    type: 'topic',
    parentId: 'cat-grade-10',
    icon: 'change_history',
    badge: 'Geometry',
    color: '#7c3aed',
    description: 'BPT Theorem, criteria for similarity, Pythagoras proof & area theorems.',
    order: 4,
    enabled: true,
  },
  {
    id: 'cat-top-trig',
    name: 'Trigonometry',
    type: 'topic',
    parentId: 'cat-grade-10',
    icon: 'architecture',
    badge: 'High-Weightage',
    color: '#db2777',
    description: 'Trigonometric ratios, identities (sin²θ+cos²θ=1), heights and distances.',
    order: 5,
    enabled: true,
  },
  {
    id: 'cat-top-mens',
    name: 'Mensuration 2D/3D',
    type: 'topic',
    parentId: 'cat-grade-10',
    icon: 'view_in_ar',
    badge: 'Geometry',
    color: '#059669',
    description: 'Surface areas and volumes of combinations of solids, frustum & sector areas.',
    order: 6,
    enabled: true,
  },
  {
    id: 'cat-top-stats',
    name: 'Statistics & Probability',
    type: 'topic',
    parentId: 'cat-grade-10',
    icon: 'analytics',
    badge: 'Scoring Chapter',
    color: '#d97706',
    description: 'Mean, median, mode of grouped data, ogive curves, and empirical probability.',
    order: 7,
    enabled: true,
  },
  {
    id: 'cat-top-coord',
    name: 'Coordinate Geometry',
    type: 'topic',
    parentId: 'cat-grade-9',
    icon: 'grid_view',
    badge: 'Coordinate Math',
    color: '#0891b2',
    description: 'Distance formula, section formula, and area of triangle coordinates.',
    order: 8,
    enabled: true,
  },

  // Exam Streams / Boards
  {
    id: 'cat-stm-cbse',
    name: 'CBSE Curriculum',
    type: 'stream',
    icon: 'verified',
    badge: 'Standard + Basic',
    color: '#004ac6',
    description: 'Strictly aligned to latest NCERT syllabus and board question patterns.',
    order: 1,
    enabled: true,
  },
  {
    id: 'cat-stm-icse',
    name: 'ICSE & State Boards',
    type: 'stream',
    icon: 'domain',
    badge: 'Comprehensive',
    color: '#0284c7',
    description: 'Covers additional topics like GST, banking, commercial arithmetic.',
    order: 2,
    enabled: true,
  },
  {
    id: 'cat-stm-olympiad',
    name: 'Olympiad & IMO Foundation',
    type: 'stream',
    icon: 'emoji_events',
    badge: 'Competitive',
    color: '#f59e0b',
    description: 'Challenging mental aptitude, non-routine math problems, and speed tricks.',
    order: 3,
    enabled: true,
  },
];

const STORAGE_KEY = 'maths_portal_categories_v1';

export function getCategories(): CategoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading categories from localStorage:', e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategoriesLocally(categories: CategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('categories-changed', { detail: categories }));
  } catch (e) {
    console.warn('Error saving categories to localStorage:', e);
  }
}

export function resetCategoriesToDefault(): CategoryItem[] {
  saveCategoriesLocally(DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

/**
 * Returns all top-level parent categories (categories that have no parentId)
 */
export function getParentCategories(categories: CategoryItem[]): CategoryItem[] {
  return categories.filter((c) => !c.parentId);
}

/**
 * Returns all direct child subcategories for a given parent category ID
 */
export function getChildCategories(categories: CategoryItem[], parentId: string): CategoryItem[] {
  return categories.filter((c) => c.parentId === parentId);
}

/**
 * Find a category by its ID
 */
export function getCategoryById(categories: CategoryItem[], id: string): CategoryItem | undefined {
  return categories.find((c) => c.id === id);
}

/**
 * Returns full hierarchy map of parent categories and their child subcategories
 */
export function getCategoryHierarchy(categories: CategoryItem[]): {
  parent: CategoryItem;
  children: CategoryItem[];
}[] {
  const parents = getParentCategories(categories);
  return parents.map((parent) => ({
    parent,
    children: getChildCategories(categories, parent.id),
  }));
}

