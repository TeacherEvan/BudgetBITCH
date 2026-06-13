// lib/utils/thai-category-mapper.ts
import type { ExpenseCategory } from '@/lib/types/budget';

/**
 * Maps Thai voice input / text to ExpenseCategory
 * Used for voice-guided expense entry
 */

export const THAI_CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  // Housing
  'ค่าเช่า': 'housing',
  'ค่าคอนโด': 'housing',
  'บ้าน': 'housing',
  'ค่าห้อง': 'housing',
  'อพาร์ตเมนท์': 'housing',
  
  // Transport
  'ค่าเดินทาง': 'transport',
  'ค่าน้ำมัน': 'transport',
  'น้ำมัน': 'transport',
  'บีทีเอส': 'transport',
  'รถไฟฟ้า': 'transport',
  'รถไฟ': 'transport',
  'ขนส่ง': 'transport',
  'กรับ': 'transport',
  'grab': 'transport',
  'โบลท์': 'transport',
  'bolt': 'transport',
  'รถเมล์': 'transport',
  'รถบัส': 'transport',
  'มอไซค์': 'transport',
  'มอเตอร์ไซค์': 'transport',
  'ทุกทุก': 'transport',
  'ทุктุค': 'transport',
  
  // Food
  'ค่าอาหาร': 'food',
  'กินข้าว': 'food',
  'อาหาร': 'food',
  'ข้าว': 'food',
  'เซปอะ': 'food',
  '7-11': 'food',
  'เซเว่น': 'food',
  'กินนอก': 'food',
  'สั่งอาหาร': 'food',
  
  // Utilities
  'ค่าน้ำค่าไฟ': 'utilities',
  'ค่าไฟ': 'utilities',
  'ค่าน้ำ': 'utilities',
  'อินเตอร์เน็ต': 'phone_internet',
  'เน็ต': 'phone_internet',
  'โทรศัพท์': 'phone_internet',
  'โทร': 'phone_internet',
  'มือถือ': 'phone_internet',
  'โทรศัพท์มือถือ': 'phone_internet',
  
  // Subscriptions
  'สมัครสมาชิก': 'subscriptions',
  'สมาชิก': 'subscriptions',
  'เน็ตฟลิกซ์': 'subscriptions',
  'netflix': 'subscriptions',
  'สปอตตี้': 'subscriptions',
  'spotify': 'subscriptions',
  'ยูทูบ': 'subscriptions',
  'youtube': 'subscriptions',
  'ดิสนีย์': 'subscriptions',
  'disney': 'subscriptions',
  'ทรูไอดี': 'subscriptions',
  'trueid': 'subscriptions',
  'เวิร์คเอาท์': 'subscriptions',
  
  // Entertainment
  'บันเทิง': 'entertainment',
  'ดูหนัง': 'entertainment',
  'หนัง': 'entertainment',
  'เล่นเกม': 'entertainment',
  'เกมส์': 'entertainment',
  'เกม': 'entertainment',
  'คอนเสิร์ต': 'entertainment',
  'งาน': 'entertainment',
  'เที่ยว': 'entertainment',
  'ท่องเที่ยว': 'entertainment',
  'คาเฟ่': 'entertainment',
  'คาเฟ': 'entertainment',
  'ชิลล์': 'entertainment',
  'chill': 'entertainment',
  
  // Healthcare
  'ค่ายา': 'healthcare',
  'ยา': 'healthcare',
  'ทันตกรรม': 'healthcare',
  'ฟัน': 'healthcare',
  'หมอ': 'healthcare',
  'โรงพยาบาล': 'healthcare',
  'คลินิก': 'healthcare',
  'ตรวจสุขภาพ': 'healthcare',
  'วัคซีน': 'healthcare',
  'ประกันสุขภาพ': 'healthcare',
  
  // Insurance
  'ประกัน': 'insurance',
  'ประกันชีวิต': 'insurance',
  'ประกันรถ': 'insurance',
  
  // Debt
  'หนี้': 'debt',
  'เงินกู้': 'debt',
  'กู้ยืม': 'debt',
  'บัตรเครดิต': 'debt',
  'เครดิต': 'debt',
  'ผ่อน': 'debt',
  'ผ่อนรถ': 'debt',
  'ผ่อนบ้าน': 'debt',
  
  // Savings
  'ออม': 'savings',
  'เก็บเงิน': 'savings',
  'กองทุน': 'savings',
  'เงินสำรอง': 'savings',
  'เงินสะสม': 'savings',
};

/**
 * Maps a Thai text input to an ExpenseCategory
 * Returns the category if found, otherwise 'other'
 */
export function mapThaiToCategory(text: string): ExpenseCategory {
  const normalized = text.trim().toLowerCase();
  
  // Direct match
  for (const [alias, category] of Object.entries(THAI_CATEGORY_ALIASES)) {
    if (normalized.includes(alias.toLowerCase())) {
      return category;
    }
  }
  
  // English aliases
  const englishAliases: Record<string, ExpenseCategory> = {
    'rent': 'housing',
    'mortgage': 'housing',
    'condo': 'housing',
    'transport': 'transport',
    'fuel': 'transport',
    'gas': 'transport',
    'grab': 'transport',
    'bolt': 'transport',
    'bts': 'transport',
    'mrt': 'transport',
    'bus': 'transport',
    'taxi': 'transport',
    'food': 'food',
    'meal': 'food',
    'lunch': 'food',
    'dinner': 'food',
    'breakfast': 'food',
    '7-eleven': 'food',
    'convenience': 'food',
    'utilities': 'utilities',
    'electricity': 'utilities',
    'water': 'utilities',
    'internet': 'phone_internet',
    'phone': 'phone_internet',
    'mobile': 'phone_internet',
    'subscription': 'subscriptions',
    'netflix': 'subscriptions',
    'spotify': 'subscriptions',
    'youtube': 'subscriptions',
    'disney': 'subscriptions',
    'entertainment': 'entertainment',
    'movie': 'entertainment',
    'game': 'entertainment',
    'cafe': 'entertainment',
    'coffee': 'entertainment',
    'healthcare': 'healthcare',
    'medical': 'healthcare',
    'doctor': 'healthcare',
    'hospital': 'healthcare',
    'pharmacy': 'healthcare',
    'insurance': 'insurance',
    'debt': 'debt',
    'loan': 'debt',
    'credit': 'debt',
    'savings': 'savings',
    'save': 'savings',
    'emergency': 'savings',
  };
  
  for (const [alias, category] of Object.entries(englishAliases)) {
    if (normalized.includes(alias.toLowerCase())) {
      return category;
    }
  }
  
  return 'other';
}

/**
 * Gets all aliases for a given category (for autocomplete suggestions)
 */
export function getAliasesForCategory(category: ExpenseCategory): string[] {
  return Object.entries(THAI_CATEGORY_ALIASES)
    .filter(([, cat]) => cat === category)
    .map(([alias]) => alias);
}