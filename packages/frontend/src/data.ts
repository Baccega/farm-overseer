export type Period = 'Month' | 'Season' | 'Year';
export type Field = { id: string; name: string; crop: string; area: number; score: number; water: string; values: Record<Period, number[]> };
export const fields: Field[] = [
  { id: 'sunflower', name: 'Sunflower field', crop: 'Sunflower', area: 18, score: 82, water: 'Good', values: { Month: [30,42,38,55,48,64,61,74], Season: [24,32,46,52,61,67,72,82], Year: [38,44,41,50,58,68,75,82] } },
  { id: 'wheat', name: 'North wheat', crop: 'Wheat', area: 22, score: 74, water: 'Watch', values: { Month: [48,51,47,57,54,62,70,74], Season: [32,38,42,55,59,65,70,74], Year: [45,48,53,51,56,62,68,74] } },
  { id: 'grape', name: 'Grape hillside', crop: 'Grape', area: 12, score: 91, water: 'Good', values: { Month: [50,57,61,65,63,75,82,91], Season: [42,51,59,64,72,79,84,91], Year: [51,54,59,65,71,79,85,91] } },
];
