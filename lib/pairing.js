// Pairing engine — MVP
// Prinsip dari blueprint bab 10:
// - constrained pairing, bukan random murni
// - filter eligibility & preference
// - hindari pasangan yang sudah bertemu di round sebelumnya
// - pastikan semua peserta dapat pasangan bila konfigurasi memungkinkan
// - generate alternatif bila dead-end, admin tetap human-review sebelum lock

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

/**
 * @param {string[]} participantIds - id peserta yang eligible untuk round ini
 * @param {Set<string>} previousPairKeys - hasil pairKey() dari round-round sebelumnya
 * @param {number} maxAttempts - berapa kali retry acak sebelum menyerah
 * @returns {{ pairs: [string,string][], leftover: string[] } }
 */
export function generatePairing(participantIds, previousPairKeys = new Set(), maxAttempts = 200) {
  let best = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pool = shuffle([...participantIds]);
    const pairs = [];
    const used = new Set();

    for (let i = 0; i < pool.length; i++) {
      const a = pool[i];
      if (used.has(a)) continue;

      let partner = null;
      for (let j = i + 1; j < pool.length; j++) {
        const b = pool[j];
        if (used.has(b)) continue;
        if (previousPairKeys.has(pairKey(a, b))) continue;
        partner = b;
        break;
      }

      if (partner) {
        pairs.push([a, partner]);
        used.add(a);
        used.add(partner);
      }
    }

    const leftover = pool.filter((id) => !used.has(id));
    const candidate = { pairs, leftover };

    if (leftover.length === 0) return candidate;
    if (!best || leftover.length < best.leftover.length) best = candidate;
  }

  // best-effort fallback after maxAttempts — admin can manually override leftovers
  return best || { pairs: [], leftover: participantIds };
}

export function collectPreviousPairKeys(previousPairings) {
  const set = new Set();
  for (const p of previousPairings) {
    set.add(pairKey(p.participant_a, p.participant_b));
  }
  return set;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
