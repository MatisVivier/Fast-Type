export function xpForLevel(level) {
  return 100 + (level - 1) * 50;
}
export function levelFromXp(totalXp = 0) {
  let xp = Math.max(0, totalXp | 0);
  let level = 1;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    if (level > 10000) break;
  }
  const need = xpForLevel(level);
  const inLevel = xp;
  const progress = need ? inLevel / need : 1;
  return { level, inLevel, need, progress, total: totalXp | 0 };
}
