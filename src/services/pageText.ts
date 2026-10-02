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
    badgeText: 'Maths at Your Fingertips',
    headlineMain: 'Easy Maths!',
    headlineHighlight: 'Easy Life!',
    tagline: 'Exclusive Math Notes, Formula Sheets, Mind Maps, Topic wise videos, Classroom courses, Practice Papers, Animated Video Lessons and much more...',
    ctaPrimaryText: 'Explore Free Material',
    ctaSecondaryText: 'Unlock Complete Access for 1 YEAR',
    stat1Value: '50,000+',
    stat1Label: 'Enrolled Students',
    stat2Value: '100%',
    stat2Label: 'Free Curriculum Access',
    stat3Value: '4.95 / 5',
    stat3Label: 'Students & Parents Rating',
  },
  announcement: {
    enabled: true,
    badge: 'Advertisement',
    title: 'Enroll in our exclusive 8 Pages Guide Series',
    subtitle: 'Beneficial for all school and competitive exams',
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
    badge: 'Our Online Teacher • Get solutions to your problems on the GO!',
    title: 'Stuck on a Tricky Math Problem?',
    description: 'Share your problem with our online teacher, your 24/7 personal math faculty! Simply type your question or upload a photo from your textbook. Receive clear, step-by-step solution, applied formulas, and exam cautions.',
    feature1: 'Simply type or just upload a photo',
    feature2: 'Get Step-by-Step Solution',
    feature3: 'Share doubts again if not satisfied',
    buttonText: 'Ask the Teacher Now!',
  },
  formulaDeck: {
    badge: 'Play with Formulas',
    title: 'Interactive Formula Deck & Amazing Mathematical Transitions',
    description: 'Experience mathematical concepts in action. Adjust parameters in real-time, inspect dynamic proofs, and watch algebra and geometry morph seamlessly.',
    buttonText: 'Launch Fullscreen Deck',
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
  } catch (_e) {
    // Graceful fallback to default page text
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
  } catch (_e) {
    // Ignore
  }
}
