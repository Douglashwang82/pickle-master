// Taipei metro area districts used for club location filtering.
// This array is the single source of truth shared by:
//   - the SQL CHECK constraint in the clubs table migration
//   - Zod validation schemas
//   - UI Select components

export const TAIPEI_DISTRICTS = [
  '中正區',
  '大同區',
  '中山區',
  '松山區',
  '大安區',
  '萬華區',
  '信義區',
  '士林區',
  '北投區',
  '內湖區',
  '南港區',
  '文山區',
  '新北市',
  '其他',
] as const;

export type TaipeiDistrict = typeof TAIPEI_DISTRICTS[number];
