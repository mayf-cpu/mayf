export interface ChapterInfo {
  id: string;
  name: string;
  grade: string;
  chapterNumber?: number;
  icon?: string;
  badge?: string;
}

export const CLASS_CHAPTERS: Record<string, ChapterInfo[]> = {
  'Class 9': [
    { id: 'c9-1', name: 'Number Systems', grade: 'Class 9', chapterNumber: 1, icon: 'filter_1', badge: 'Ch 1' },
    { id: 'c9-2', name: 'Polynomials', grade: 'Class 9', chapterNumber: 2, icon: 'functions', badge: 'Ch 2' },
    { id: 'c9-3', name: 'Coordinate Geometry', grade: 'Class 9', chapterNumber: 3, icon: 'grid_view', badge: 'Ch 3' },
    { id: 'c9-4', name: 'Linear Equations in Two Variables', grade: 'Class 9', chapterNumber: 4, icon: 'stacked_line_chart', badge: 'Ch 4' },
    { id: 'c9-5', name: "Introduction to Euclid's Geometry", grade: 'Class 9', chapterNumber: 5, icon: 'architecture', badge: 'Ch 5' },
    { id: 'c9-6', name: 'Lines and Angles', grade: 'Class 9', chapterNumber: 6, icon: 'show_chart', badge: 'Ch 6' },
    { id: 'c9-7', name: 'Triangles', grade: 'Class 9', chapterNumber: 7, icon: 'change_history', badge: 'Ch 7' },
    { id: 'c9-8', name: 'Quadrilaterals', grade: 'Class 9', chapterNumber: 8, icon: 'crop_square', badge: 'Ch 8' },
    { id: 'c9-9', name: 'Circles', grade: 'Class 9', chapterNumber: 9, icon: 'trip_origin', badge: 'Ch 9' },
    { id: 'c9-10', name: "Heron's Formula", grade: 'Class 9', chapterNumber: 10, icon: 'square_foot', badge: 'Ch 10' },
    { id: 'c9-11', name: 'Surface Areas and Volumes', grade: 'Class 9', chapterNumber: 11, icon: 'view_in_ar', badge: 'Ch 11' },
    { id: 'c9-12', name: 'Statistics', grade: 'Class 9', chapterNumber: 12, icon: 'bar_chart', badge: 'Ch 12' },
    { id: 'c9-13', name: 'Probability', grade: 'Class 9', chapterNumber: 13, icon: 'casino', badge: 'Ch 13' },
  ],
  'Class 10': [
    { id: 'c10-1', name: 'Real Numbers', grade: 'Class 10', chapterNumber: 1, icon: 'filter_1', badge: 'Ch 1' },
    { id: 'c10-2', name: 'Polynomials', grade: 'Class 10', chapterNumber: 2, icon: 'functions', badge: 'Ch 2' },
    { id: 'c10-3', name: 'Pair of Linear Equations', grade: 'Class 10', chapterNumber: 3, icon: 'stacked_line_chart', badge: 'Ch 3' },
    { id: 'c10-4', name: 'Quadratic Equations', grade: 'Class 10', chapterNumber: 4, icon: 'trending_up', badge: 'Ch 4' },
    { id: 'c10-5', name: 'Arithmetic Progressions', grade: 'Class 10', chapterNumber: 5, icon: 'format_list_numbered', badge: 'Ch 5' },
    { id: 'c10-6', name: 'Triangles', grade: 'Class 10', chapterNumber: 6, icon: 'change_history', badge: 'Ch 6' },
    { id: 'c10-7', name: 'Coordinate Geometry', grade: 'Class 10', chapterNumber: 7, icon: 'grid_view', badge: 'Ch 7' },
    { id: 'c10-8', name: 'Introduction to Trigonometry', grade: 'Class 10', chapterNumber: 8, icon: 'architecture', badge: 'Ch 8' },
    { id: 'c10-9', name: 'Some Applications of Trigonometry', grade: 'Class 10', chapterNumber: 9, icon: 'height', badge: 'Ch 9' },
    { id: 'c10-10', name: 'Circles', grade: 'Class 10', chapterNumber: 10, icon: 'trip_origin', badge: 'Ch 10' },
    { id: 'c10-11', name: 'Areas Related to Circles', grade: 'Class 10', chapterNumber: 11, icon: 'pie_chart', badge: 'Ch 11' },
    { id: 'c10-12', name: 'Surface Areas and Volumes', grade: 'Class 10', chapterNumber: 12, icon: 'view_in_ar', badge: 'Ch 12' },
    { id: 'c10-13', name: 'Statistics', grade: 'Class 10', chapterNumber: 13, icon: 'bar_chart', badge: 'Ch 13' },
    { id: 'c10-14', name: 'Probability', grade: 'Class 10', chapterNumber: 14, icon: 'casino', badge: 'Ch 14' },
  ],
  'Class 8': [
    { id: 'c8-1', name: 'Rational Numbers', grade: 'Class 8', chapterNumber: 1, icon: 'pin', badge: 'Ch 1' },
    { id: 'c8-2', name: 'Linear Equations in One Variable', grade: 'Class 8', chapterNumber: 2, icon: 'stacked_line_chart', badge: 'Ch 2' },
    { id: 'c8-3', name: 'Understanding Quadrilaterals', grade: 'Class 8', chapterNumber: 3, icon: 'crop_square', badge: 'Ch 3' },
    { id: 'c8-4', name: 'Data Handling', grade: 'Class 8', chapterNumber: 4, icon: 'bar_chart', badge: 'Ch 4' },
    { id: 'c8-5', name: 'Squares and Square Roots', grade: 'Class 8', chapterNumber: 5, icon: 'looks_two', badge: 'Ch 5' },
    { id: 'c8-6', name: 'Cubes and Cube Roots', grade: 'Class 8', chapterNumber: 6, icon: 'looks_3', badge: 'Ch 6' },
    { id: 'c8-7', name: 'Comparing Quantities', grade: 'Class 8', chapterNumber: 7, icon: 'percent', badge: 'Ch 7' },
    { id: 'c8-8', name: 'Algebraic Expressions and Identities', grade: 'Class 8', chapterNumber: 8, icon: 'functions', badge: 'Ch 8' },
    { id: 'c8-9', name: 'Mensuration', grade: 'Class 8', chapterNumber: 9, icon: 'view_in_ar', badge: 'Ch 9' },
    { id: 'c8-10', name: 'Exponents and Powers', grade: 'Class 8', chapterNumber: 10, icon: 'superscript', badge: 'Ch 10' },
    { id: 'c8-11', name: 'Direct and Inverse Proportions', grade: 'Class 8', chapterNumber: 11, icon: 'swap_horiz', badge: 'Ch 11' },
    { id: 'c8-12', name: 'Factorisation', grade: 'Class 8', chapterNumber: 12, icon: 'hub', badge: 'Ch 12' },
    { id: 'c8-13', name: 'Introduction to Graphs', grade: 'Class 8', chapterNumber: 13, icon: 'grid_on', badge: 'Ch 13' },
  ],
  'Class 7': [
    { id: 'c7-1', name: 'Integers', grade: 'Class 7', chapterNumber: 1, icon: 'pin', badge: 'Ch 1' },
    { id: 'c7-2', name: 'Fractions and Decimals', grade: 'Class 7', chapterNumber: 2, icon: 'pie_chart', badge: 'Ch 2' },
    { id: 'c7-3', name: 'Data Handling', grade: 'Class 7', chapterNumber: 3, icon: 'bar_chart', badge: 'Ch 3' },
    { id: 'c7-4', name: 'Simple Equations', grade: 'Class 7', chapterNumber: 4, icon: 'stacked_line_chart', badge: 'Ch 4' },
    { id: 'c7-5', name: 'Lines and Angles', grade: 'Class 7', chapterNumber: 5, icon: 'show_chart', badge: 'Ch 5' },
    { id: 'c7-6', name: 'The Triangle and Its Properties', grade: 'Class 7', chapterNumber: 6, icon: 'change_history', badge: 'Ch 6' },
    { id: 'c7-7', name: 'Congruence of Triangles', grade: 'Class 7', chapterNumber: 7, icon: 'polyline', badge: 'Ch 7' },
    { id: 'c7-8', name: 'Comparing Quantities', grade: 'Class 7', chapterNumber: 8, icon: 'percent', badge: 'Ch 8' },
    { id: 'c7-9', name: 'Rational Numbers', grade: 'Class 7', chapterNumber: 9, icon: 'pin', badge: 'Ch 9' },
    { id: 'c7-10', name: 'Perimeter and Area', grade: 'Class 7', chapterNumber: 10, icon: 'square_foot', badge: 'Ch 10' },
    { id: 'c7-11', name: 'Algebraic Expressions', grade: 'Class 7', chapterNumber: 11, icon: 'functions', badge: 'Ch 11' },
    { id: 'c7-12', name: 'Exponents and Powers', grade: 'Class 7', chapterNumber: 12, icon: 'superscript', badge: 'Ch 12' },
  ],
  'Class 6': [
    { id: 'c6-1', name: 'Knowing Our Numbers', grade: 'Class 6', chapterNumber: 1, icon: 'filter_1', badge: 'Ch 1' },
    { id: 'c6-2', name: 'Whole Numbers', grade: 'Class 6', chapterNumber: 2, icon: 'pin', badge: 'Ch 2' },
    { id: 'c6-3', name: 'Playing with Numbers', grade: 'Class 6', chapterNumber: 3, icon: 'casino', badge: 'Ch 3' },
    { id: 'c6-4', name: 'Basic Geometrical Ideas', grade: 'Class 6', chapterNumber: 4, icon: 'architecture', badge: 'Ch 4' },
    { id: 'c6-5', name: 'Understanding Elementary Shapes', grade: 'Class 6', chapterNumber: 5, icon: 'shapes', badge: 'Ch 5' },
    { id: 'c6-6', name: 'Integers', grade: 'Class 6', chapterNumber: 6, icon: 'numbers', badge: 'Ch 6' },
    { id: 'c6-7', name: 'Fractions', grade: 'Class 6', chapterNumber: 7, icon: 'pie_chart', badge: 'Ch 7' },
    { id: 'c6-8', name: 'Decimals', grade: 'Class 6', chapterNumber: 8, icon: 'calculate', badge: 'Ch 8' },
    { id: 'c6-9', name: 'Data Handling', grade: 'Class 6', chapterNumber: 9, icon: 'bar_chart', badge: 'Ch 9' },
    { id: 'c6-10', name: 'Mensuration', grade: 'Class 6', chapterNumber: 10, icon: 'square_foot', badge: 'Ch 10' },
    { id: 'c6-11', name: 'Algebra', grade: 'Class 6', chapterNumber: 11, icon: 'functions', badge: 'Ch 11' },
    { id: 'c6-12', name: 'Ratio and Proportion', grade: 'Class 6', chapterNumber: 12, icon: 'percent', badge: 'Ch 12' },
  ],
  'Class 5': [
    { id: 'c5-1', name: 'The Fish Tale (Numbers)', grade: 'Class 5', chapterNumber: 1, icon: 'filter_1', badge: 'Ch 1' },
    { id: 'c5-2', name: 'Shapes and Angles', grade: 'Class 5', chapterNumber: 2, icon: 'shapes', badge: 'Ch 2' },
    { id: 'c5-3', name: 'How Many Squares?', grade: 'Class 5', chapterNumber: 3, icon: 'crop_square', badge: 'Ch 3' },
    { id: 'c5-4', name: 'Parts and Wholes (Fractions)', grade: 'Class 5', chapterNumber: 4, icon: 'pie_chart', badge: 'Ch 4' },
    { id: 'c5-5', name: 'Does It Look the Same?', grade: 'Class 5', chapterNumber: 5, icon: 'flip', badge: 'Ch 5' },
    { id: 'c5-6', name: 'Be My Multiple, I will be Your Factor', grade: 'Class 5', chapterNumber: 6, icon: 'grid_4x4', badge: 'Ch 6' },
    { id: 'c5-7', name: 'Can You See the Pattern?', grade: 'Class 5', chapterNumber: 7, icon: 'auto_awesome', badge: 'Ch 7' },
    { id: 'c5-8', name: 'Mapping Your Way', grade: 'Class 5', chapterNumber: 8, icon: 'map', badge: 'Ch 8' },
    { id: 'c5-9', name: 'Boxes and Sketches', grade: 'Class 5', chapterNumber: 9, icon: 'view_in_ar', badge: 'Ch 9' },
    { id: 'c5-10', name: 'Tenths and Hundredths', grade: 'Class 5', chapterNumber: 10, icon: 'calculate', badge: 'Ch 10' },
    { id: 'c5-11', name: 'Area and Its Boundary', grade: 'Class 5', chapterNumber: 11, icon: 'square_foot', badge: 'Ch 11' },
    { id: 'c5-12', name: 'Smart Charts', grade: 'Class 5', chapterNumber: 12, icon: 'bar_chart', badge: 'Ch 12' },
  ],
};

export const getChaptersForGrade = (grade: string): ChapterInfo[] => {
  return CLASS_CHAPTERS[grade] || CLASS_CHAPTERS['Class 9'] || [];
};
