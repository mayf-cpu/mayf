/**
 * Service to manage the positions, ordering, and visibility of blocks
 * on the website homepage. Changes are persisted in Firestore and localStorage.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface HomePageBlock {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  badge?: string;
}

export const DEFAULT_PAGE_BLOCKS: HomePageBlock[] = [
  {
    id: 'hero',
    name: 'Hero Welcome Banner',
    description: 'Main introduction, curriculum overview, and core download CTAs',
    enabled: true,
    order: 1,
    badge: 'Introduction',
  },
  {
    id: 'class_selector',
    name: 'Class 5 - 10 Grade Selector Strip',
    description: 'Horizontal quick-switch pills for Class 5 to Class 10 & Olympiad',
    enabled: true,
    order: 2,
    badge: 'Navigation',
  },
  {
    id: 'catalog_filters',
    name: 'Format Tabs & Quick Search',
    description: 'Handwritten Notes, 1-Pagers, NCERT, Video Lessons tabs & search input',
    enabled: true,
    order: 3,
    badge: 'Filters',
  },
  {
    id: 'content_catalog',
    name: 'Content Blocks & Downloadable Cards Grid',
    description: 'Main resource cards grid with thumbnails, ratings, free & pro kits',
    enabled: true,
    order: 4,
    badge: 'Core Content',
  },
  {
    id: 'social_community',
    name: 'Study Together • Grow Faster',
    description: 'Social media channels (WhatsApp, Telegram, YouTube, Instagram) study group community',
    enabled: true,
    order: 5,
    badge: 'Community',
  },
  {
    id: 'ai_teacher',
    name: 'Ask Teacher Spotlight Banner',
    description: '24/7 AI Classroom Teacher assistant with authentic blackboard derivations',
    enabled: true,
    order: 6,
    badge: 'AI Faculty',
  },
  {
    id: 'formula_deck',
    name: 'Interactive Formula Deck & Sandbox',
    description: 'Interactive geometry, algebra, and trigonometry formula sandbox',
    enabled: true,
    order: 7,
    badge: 'Sandbox',
  },
  {
    id: 'paid_masterclasses',
    name: 'Pro Pass Masterclasses & Curriculums',
    description: 'All-inclusive annual VIP membership pass banner with Razorpay checkout',
    enabled: true,
    order: 8,
    badge: 'Pro Tier',
  },
  {
    id: 'faq',
    name: 'Frequently Asked Questions (FAQ)',
    description: 'Answers regarding PDF downloads, printing, syllabus alignment, and teacher solutions',
    enabled: true,
    order: 9,
    badge: 'Support',
  },
];

const BLOCKS_STORAGE_KEY = 'maths_hub_page_blocks_order_v2';

export function getLocalPageBlocks(): HomePageBlock[] {
  try {
    const raw = localStorage.getItem(BLOCKS_STORAGE_KEY);
    if (raw) {
      const parsed: HomePageBlock[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all default block IDs exist
        const merged = DEFAULT_PAGE_BLOCKS.map((def) => {
          const found = parsed.find((p) => p.id === def.id);
          return found ? { ...def, ...found } : def;
        });
        return merged.sort((a, b) => a.order - b.order);
      }
    }
  } catch (e) {
    console.warn('Error reading page blocks from localStorage:', e);
  }
  return DEFAULT_PAGE_BLOCKS;
}

export function saveLocalPageBlocks(blocks: HomePageBlock[]): void {
  try {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(sorted));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('page-blocks-changed', { detail: sorted }));
    }
  } catch (e) {
    console.warn('Error saving page blocks locally:', e);
  }
}

export async function loadPageBlocksFromFirestore(): Promise<HomePageBlock[]> {
  try {
    const docRef = doc(db, 'settings', 'page_blocks');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.blocks)) {
        saveLocalPageBlocks(data.blocks);
        return data.blocks;
      }
    }
  } catch (e) {
    console.warn('Notice: Firestore page blocks not yet initialized, using defaults:', e);
  }
  return getLocalPageBlocks();
}

export async function savePageBlocksToFirestore(blocks: HomePageBlock[]): Promise<void> {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  saveLocalPageBlocks(sorted);
  try {
    const docRef = doc(db, 'settings', 'page_blocks');
    await setDoc(docRef, {
      blocks: sorted,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('Notice saving page blocks to cloud:', e);
  }
}
