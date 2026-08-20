import type { PlaceCandidate } from './travelPlaceData.ts';

type NameParts = { compact: string; tokens: string[] };

export function normalizePlaceName(value: string): NameParts {
  const words = value.normalize('NFKD').toLocaleLowerCase()
    .replace(/\p{M}/gu, '').replace(/&/g, ' and ').match(/[\p{L}\p{N}]+/gu) ?? [];
  return { compact: words.join(''), tokens: words };
}

function editSimilarity(left: string, right: string) {
  if (left === right) return 1;
  if (!left.length || !right.length) return 0;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return 1 - previous[right.length] / Math.max(left.length, right.length);
}

function tokenSimilarity(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const shared = [...leftSet].filter((token) => rightSet.has(token)).length;
  return shared ? (2 * shared) / (leftSet.size + rightSet.size) : 0;
}

function matchScore(value: NameParts, candidate: NameParts) {
  if (value.compact === candidate.compact) return 1;
  const tokenScore = tokenSimilarity(value.tokens, candidate.tokens);
  const editScore = editSimilarity(value.compact, candidate.compact);
  return Math.max(tokenScore, editScore >= 0.88 ? editScore : 0);
}

export function findPlaceNameMatch(value: string, places: PlaceCandidate[]) {
  const normalized = normalizePlaceName(value);
  if (!normalized.compact) return null;
  const ranked = places.map((place) => {
    const candidate = normalizePlaceName(place.name);
    return { place, exact: normalized.compact === candidate.compact, score: matchScore(normalized, candidate) };
  })
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  if (!best || best.score < 0.8) return null;
  if (!best.exact && ranked[1] && best.score - ranked[1].score < 0.08) return null;
  return best.place;
}
