export type ModuleKey =
  | 'pythagoras'
  | 'unit_circle'
  | 'quadratic'
  | 'algebraic'
  | 'linear_systems'
  | 'progressions'
  | 'geom_progression'
  | 'circle'
  | 'similar_triangles'
  | 'coordinate_geom'
  | 'lines_angles'
  | 'mensuration'
  | 'fractions'
  | 'statistics'
  | 'probability'
  | 'calculus';

export type StandardGrade = 'Class 5-8' | 'Class 9-10' | 'Class 11-12 & Olympiad';

export type MathCategory =
  | 'Algebra'
  | 'Geometry'
  | 'Trigonometry'
  | 'Mensuration'
  | 'Statistics & Probability'
  | 'Calculus'
  | 'Arithmetic & Numbers';

export interface TransitionTopic {
  key: ModuleKey;
  label: string;
  icon: string;
  grade: string;
  standardGroup: StandardGrade;
  category: MathCategory;
  shortDesc: string;
  badge: string;
}
