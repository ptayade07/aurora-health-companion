// Pixel companion system — 8×8 sprite grid, SVG-rendered

export type CompanionType =
  | 'fox' | 'cat' | 'deer' | 'shark' | 'owl'
  | 'rabbit' | 'wolf' | 'dragon' | 'unicorn';

export type CompanionMood =
  | 'sleeping' | 'tired' | 'calm' | 'curious'
  | 'happy' | 'excited' | 'celebrating';

export function getMoodFromScore(score: number): CompanionMood {
  if (score >= 90) return 'celebrating';
  if (score >= 75) return 'excited';
  if (score >= 55) return 'happy';
  if (score >= 40) return 'curious';
  if (score >= 25) return 'calm';
  if (score >= 10) return 'tired';
  return 'sleeping';
}

export type CompanionDef = {
  id: CompanionType;
  name: string;
  emoji: string;
  description: string;
  accentColor: string;
  palette: Record<string, string>;
  // 8 rows × 8 cols. '.' = transparent, 'E' = eye placeholder (rendered per-mood)
  sprite: string[];
  eyeRow: number;
  eyeLeftCol: number;
  eyeRightCol: number;
  // color used as background at 'E' positions so eye renders cleanly
  eyeBgColor: string;
};

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    description: 'Clever & quick-witted',
    accentColor: '#E8722A',
    palette: { b: '#E8722A', w: '#FFF0D0' },
    sprite: [
      '.bb..bb.',  // 0: ears
      'bbbbbbbb',  // 1: head
      'bwEwwEwb',  // 2: EYES
      'bwwwwwwb',  // 3: lower face
      '.bwwwwb.',  // 4: chin/snout
      '.bbbbbb.',  // 5: neck
      'bbwwwwbb',  // 6: body / belly
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    description: 'Cool & independent',
    accentColor: '#9A8FD0',
    palette: { b: '#4A4A5A', w: '#EEE8DC' },
    sprite: [
      'bb....bb',  // 0: pointy ears
      'bbb..bbb',  // 1: ear base
      'bwEwwEwb',  // 2: EYES
      'bwwwwwwb',  // 3: face
      '..bwwb..',  // 4: chin
      '.bbbbbb.',  // 5: body
      'bbbbbbbb',  // 6: body lower
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'deer',
    name: 'Deer',
    emoji: '🦌',
    description: 'Gentle & graceful',
    accentColor: '#C8A46A',
    palette: { b: '#C8A46A', w: '#F5E6C0', a: '#6B3A0A' },
    sprite: [
      'a..aa..a',  // 0: antlers
      '..bbbb..',  // 1: head
      'bwEwwEwb',  // 2: EYES
      'bwwwwwwb',  // 3: face
      '..bwwb..',  // 4: snout
      '.bbbbbb.',  // 5: body
      'bbwwwwbb',  // 6: body / belly
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'shark',
    name: 'Shark',
    emoji: '🦈',
    description: 'Bold & fearless',
    accentColor: '#4A8EC9',
    palette: { b: '#4A8EC9', w: '#E8F8FF' },
    sprite: [
      '...bb...',  // 0: dorsal fin
      'bbbbbbbb',  // 1: head
      'bwEwwEwb',  // 2: EYES
      'bwwwwwwb',  // 3: belly
      'bwwwwwwb',  // 4: belly lower
      '.bbbbbb.',  // 5: body
      'b......b',  // 6: tail spread
      '.bb..bb.',  // 7: tail fins
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'owl',
    name: 'Owl',
    emoji: '🦉',
    description: 'Wise & observant',
    accentColor: '#FFD700',
    palette: { b: '#7B5C2A', w: '#FFF8E7', y: '#FFD700' },
    sprite: [
      '.bb..bb.',  // 0: ear tufts
      'bbyyyybb',  // 1: yellow eye field top
      'bEyyyyEb',  // 2: EYES (bigger, on yellow)
      'bbyyyybb',  // 3: yellow eye field bottom
      '..bwwb..',  // 4: beak
      '.bbbbbb.',  // 5: body
      'bbbbbbbb',  // 6: body lower
      '.bb..bb.',  // 7: feet
    ],
    eyeRow: 2, eyeLeftCol: 1, eyeRightCol: 6, eyeBgColor: 'y',
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    description: 'Sweet & energetic',
    accentColor: '#A0B0D0',
    palette: { b: '#C8D0E0', w: '#F8F8FF', p: '#FF9999' },
    sprite: [
      '.bb..bb.',  // 0: tall ears (top)
      '.bb..bb.',  // 1: tall ears (mid)
      'bbbbbbbb',  // 2: head
      'bwEwwEwb',  // 3: EYES
      'bwwwwwwb',  // 4: face
      '.bwwpwwb',  // 5: nose (p=pink)
      '.bbbbbb.',  // 6: body
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 3, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'wolf',
    name: 'Wolf',
    emoji: '🐺',
    description: 'Fierce & loyal',
    accentColor: '#7A8490',
    palette: { b: '#7A8490', w: '#D8DDE0', d: '#4A5560' },
    sprite: [
      'bb....bb',  // 0: pointed ears
      'bbb..bbb',  // 1: ear base
      'bdEwwEdb',  // 2: EYES with dark patches (d=dark grey)
      'bwwwwwwb',  // 3: muzzle
      '..bwwb..',  // 4: chin
      '.bbbbbb.',  // 5: body
      'bbbbbbbb',  // 6: body lower
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    description: 'Rare & powerful',
    accentColor: '#2D8F4E',
    palette: { b: '#2D8F4E', w: '#A8E8B8' },
    sprite: [
      '...bb...',  // 0: head spike
      '..bbbb..',  // 1: head
      'bwEwwEwb',  // 2: EYES
      'bwwwwwwb',  // 3: face
      '..bwwb..',  // 4: snout
      'bbbbbbbb',  // 5: body
      'bwwwwwwb',  // 6: belly
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
  {
    id: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    description: 'Magic & unstoppable',
    accentColor: '#C8A8E8',
    palette: { b: '#C8A8E8', w: '#F8F0FF', y: '#FFD700', m: '#9B4DCA' },
    sprite: [
      '..y.....',  // 0: gold horn
      'bbbbbmmb',  // 1: head + rainbow mane
      'bwEwwEmb',  // 2: EYES + mane
      'bwwwwwmb',  // 3: face + mane
      '..bwwb..',  // 4: snout
      'bbbbbmmb',  // 5: body + mane
      'bwwwwmmb',  // 6: belly + mane
      '.bb..bb.',  // 7: legs
    ],
    eyeRow: 2, eyeLeftCol: 2, eyeRightCol: 5, eyeBgColor: 'w',
  },
];

export function getCompanion(id: CompanionType): CompanionDef {
  return COMPANIONS.find((c) => c.id === id) ?? COMPANIONS[0];
}

export const BOUNCE_PARAMS: Record<CompanionMood, { amplitude: number; duration: number }> = {
  sleeping:    { amplitude: 2,  duration: 3200 },
  tired:       { amplitude: 4,  duration: 2200 },
  calm:        { amplitude: 6,  duration: 1400 },
  curious:     { amplitude: 8,  duration: 1000 },
  happy:       { amplitude: 11, duration: 750  },
  excited:     { amplitude: 15, duration: 480  },
  celebrating: { amplitude: 18, duration: 350  },
};

export const MOVE_INTERVAL: Record<CompanionMood, number> = {
  sleeping:    20000,
  tired:       14000,
  calm:        9000,
  curious:     6500,
  happy:       4500,
  excited:     3000,
  celebrating: 2000,
};
