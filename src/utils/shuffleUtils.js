/**
 * Deterministically shuffles an array based on a seed string (e.g., team.id or team_key_hash).
 * This ensures:
 * 1. Adjacent teams get different question sequences.
 * 2. If a team refreshes or reloads their page, they retain their identical question sequence.
 */
export function seededShuffle(array, seedStr) {
  if (!array || array.length <= 1) return array ? [...array] : [];
  if (!seedStr) return [...array];

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const result = [...array];
  let seed = Math.abs(hash) || 12345;

  for (let i = result.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Returns a deterministic riddle index (0 or 1) for a team
 * so adjacent teams get different riddles.
 */
export function getTeamRiddleIndex(seedStr) {
  if (!seedStr) return 0;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2;
}
