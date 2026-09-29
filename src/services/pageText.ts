/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HeroBlockConfig {
  badgeText: string;
  headlineMain: string;
  headlineHighlight: string;
  tagline: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

export interface AnnouncementBannerConfig {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  actionUrl?: string;
}

export interface CatalogBlockConfig {
  sectionBadge: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  activeFilterHint: string;
}

export interface AiTeacherBlockConfig {
  badge: string;
  title: string;
  description: string;
  feature1: string;
  feature2: string;
  feature3: string;
  buttonText: string;
}

export interface FormulaDeckBlockConfig {
  badge: string;
  title: string;
  description: string;
  buttonText: string;
}

export interface MidBannerConfig {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
}

export interface ProMasterclassBlockConfig {
  badge: string;
  headline: string;
  subtitle: string;
  perk1: string;
  perk2: string;
  perk3: string;
  dealTag: string;
  dealDescription: string;
  buttonText: string;
  guaranteeText: string;
}

export interface SocialCommunityBlockConfig {
  badge: string;
  title: string;
  subtitle: string;
}

export interface FaqBlockConfig {
  title: string;
  subtitle: string;
  items: FaqItem[];
}

export interface FooterBlockConfig {
  aboutText: string;
  mentorSignoff: string;
  copyrightText: string;
}

export interface FormulaDeckPageConfig {
  title: string;
  subtitle: string;
  badgeText: string;
  instructionText: string;
}

export interface PageTextConfig {
  hero: HeroBlockConfig;
  announcement: AnnouncementBannerConfig;
  catalog: CatalogBlockConfig;
  aiTeacher: AiTeacherBlockConfig;
  formulaDeck: FormulaDeckBlockConfig;
  midBanner: MidBannerConfig;
  proMasterclass: ProMasterclassBlockConfig;
  socialCommunity: SocialCommunityBlockConfig;
  faq: FaqBlockConfig;
  footer: FooterBlockConfig;
  formulaDeckPage: FormulaDeckPageConfig;
  updatedAt?: string;
}

export const DEFAULT_PAGE_TEXT: PageTextConfig = {
  hero: {
    badgeText: 'CBSE, ICSE & State Boards • New 2025 Edition',
    headlineMain: 'Ace School Maths',
    headlineHighlight: 'Without the Stress!',
    tagline: 'Handcrafted chapter notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons tailor-made for Class 5 to 10.',
    ctaPrimaryText: 'Explore Free Notes',
    ctaSecondaryText: 'Unlock Pro Masterclass',
    stat1Value: '50,000+',
    stat1Label: 'Enrolled Students',
    stat2Value: '100%',
    stat2Label: 'Free Curriculum Access',
    stat3Value: '4.9 / 5',
    stat3Label: 'Student & Parent Rating',
  },
  announcement: {
    enabled: true,
    badge: 'Advertisement',
    title: 'National Math Olympiad Preparatory Kit 2025',
    subtitle: 'NCERT Aligned • Mock Tests & AI Live Doubts',
    buttonText: 'Enroll Now',
  },
  catalog: {
    sectionBadge: 'Curriculum Resources',
    title: 'Handcrafted Study Vault',
    subtitle: 'Filter by standard, format, and chapter to find crystal-clear notes and formula sheets.',
    searchPlaceholder: 'Search formulas, chapters, theorems...',
    activeFilterHint: 'Instant free downloads — No forced login or paywall required for 1-pagers',
  },
  aiTeacher: {
    badge: 'AI Teacher Assistant • Step-by-Step Solver',
    title: 'Stuck on a Tricky Math Problem?',
    description: 'Meet Prof. Raman, your 24/7 personal math faculty! Simply type your question or upload a photo from your textbook. Receive clear, pedagogical step-by-step working, applied formulas, and exam cautions.',
    feature1: 'Text or Photo Input',
    feature2: 'Step-by-Step Proofs',
    feature3: 'Class 5 - 10 & Olympiad',
    buttonText: 'Ask Teacher AI Now',
  },
  formulaDeck: {
    badge: 'Maths at Your Fingertips Sandbox',
    title: 'Interactive Formula Deck & Mathematical Transitions',
    description: 'Experience mathematical concepts in action. Adjust parameters in real-time, inspect dynamic proofs, and watch algebra and geometry morph seamlessly.',
    buttonText: 'Launch Fullscreen Deck (/#formula-deck)',
  },
  midBanner: {
    enabled: true,
    badge: 'Sponsored Content',
    title: 'Mental Math Master: Speed Multiplication Camp',
    subtitle: 'Live weekend sessions for ages 10-15 • Learn Vedic Math tricks',
    buttonText: 'Claim Free Seat →',
  },
  proMasterclass: {
    badge: 'THE ULTIMATE CLASS 9 & 10 MATHS VAULT',
    headline: 'Stop Memorizing Formulas. Understand Them Visually.',
    subtitle: 'Get unlimited access to all 48 chapter cheatsheets, video derivation library, and instant live doubt support before your board exams.',
    perk1: 'Printable Pocket Flashcards',
    perk2: 'NCERT Exemplar Video Solutions',
    perk3: 'WhatsApp Mentor Hotline',
    dealTag: 'Limited Time Semester Deal',
    dealDescription: 'Covers complete syllabus for your selected grade with monthly updates.',
    buttonText: 'Get All-Access Pass',
    guaranteeText: 'Cancel anytime • 7-day money-back guarantee',
  },
  socialCommunity: {
    badge: 'Study Together • Grow Faster',
    title: 'Join 150k+ Maths Champions on Our Channels',
    subtitle: 'Daily morning formulas, 60-second theorem reels, previous year question polls, and round-the-clock homework peer support.',
  },
  faq: {
    title: 'Frequently Asked Questions by Students & Parents',
    subtitle: 'Everything you need to know about downloading and using our curriculum guides',
    items: [
      {
        id: 'faq-1',
        question: 'Are all Class 5 to Class 10 formula sheets completely free?',
        answer: 'Yes! All 1-page formula summaries, basic cheat sheets, and NCERT exercise overviews are 100% free to download without any mandatory login or payment. Premium packs contain extended video lectures and full answer keys.',
      },
      {
        id: 'faq-2',
        question: 'Can I print these sheets on normal A4 paper?',
        answer: 'Absolutely. Every PDF is calibrated with 0.5-inch margins and high-contrast vector typography so it prints crisply on any standard home or school black & white or color printer.',
      },
      {
        id: 'faq-3',
        question: 'How are the paid masterclasses accessed after purchase?',
        answer: 'Instantly upon successful payment via Razorpay, your Pro pass is activated and the direct download links and private student portal materials will be immediately unlocked.',
      },
      {
        id: 'faq-4',
        question: 'Which educational boards are covered?',
        answer: 'Our materials are strictly designed around CBSE NCERT curricula, with additional foundational chapters and Olympiad problem sets for ICSE and major State Boards.',
      },
      {
        id: 'faq-5',
        question: 'How does the AI Teacher Assistant solve questions?',
        answer: 'The AI Teacher breaks down any query into: Given Data, Applicable Formula, Step-by-Step Proof, and Exam Caution Tips to build genuine mathematical intuition rather than rote shortcuts.',
      },
    ],
  },
  footer: {
    aboutText: 'Demystifying school mathematics for Class 5 to Class 10. Step-by-step NCERT solutions, animated concept summaries, and rapid revision sheets created by expert educators.',
    mentorSignoff: 'Curated with dedication by passionate math educators for CBSE, ICSE & Olympiads.',
    copyrightText: 'Maths at Your Fingertips. Built for ambitious students, parents & educators.',
  },
  formulaDeckPage: {
    title: 'Interactive Formula Deck Sandbox',
    subtitle: 'Explore mathematical theorems with real-time parameter controls, formula sheets, and step-by-step breakdowns.',
    badgeText: 'Interactive Visual Math Lab',
    instructionText: 'Select any mathematical theorem or identity below to see dynamic visual proofs, variable adjustments, and download print-ready 1-page revision sheets.',
  },
};

const STORAGE_KEY = 'maths_hub_page_text_v1';

/**
 * Retrieve current page text config from localStorage or defaults
 */
export function getPageTextConfig(): PageTextConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        hero: { ...DEFAULT_PAGE_TEXT.hero, ...(parsed.hero || {}) },
        announcement: { ...DEFAULT_PAGE_TEXT.announcement, ...(parsed.announcement || {}) },
        catalog: { ...DEFAULT_PAGE_TEXT.catalog, ...(parsed.catalog || {}) },
        aiTeacher: { ...DEFAULT_PAGE_TEXT.aiTeacher, ...(parsed.aiTeacher || {}) },
        formulaDeck: { ...DEFAULT_PAGE_TEXT.formulaDeck, ...(parsed.formulaDeck || {}) },
        midBanner: { ...DEFAULT_PAGE_TEXT.midBanner, ...(parsed.midBanner || {}) },
        proMasterclass: { ...DEFAULT_PAGE_TEXT.proMasterclass, ...(parsed.proMasterclass || {}) },
        socialCommunity: { ...DEFAULT_PAGE_TEXT.socialCommunity, ...(parsed.socialCommunity || {}) },
        faq: {
          ...DEFAULT_PAGE_TEXT.faq,
          ...(parsed.faq || {}),
          items: Array.isArray(parsed.faq?.items) && parsed.faq.items.length > 0 ? parsed.faq.items : DEFAULT_PAGE_TEXT.faq.items,
        },
        footer: { ...DEFAULT_PAGE_TEXT.footer, ...(parsed.footer || {}) },
        formulaDeckPage: { ...DEFAULT_PAGE_TEXT.formulaDeckPage, ...(parsed.formulaDeckPage || {}) },
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (e) {
    console.warn('Failed to parse local page text config:', e);
  }
  return DEFAULT_PAGE_TEXT;
}

/**
 * Save page text config locally and dispatch a broadcast event
 */
export function savePageTextConfigLocally(config: PageTextConfig): void {
  try {
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent<PageTextConfig>('page-text-changed', {
        detail: payload,
      })
    );
  } catch (e) {
    console.warn('Failed to save page text config locally:', e);
  }
}
