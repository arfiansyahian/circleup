// Voting & Matching Logic — sesuai blueprint bab 11
// A -> B Interested & B -> A Interested = Mutual Match. Semua kombinasi lain = No match.

export function isMutualMatch(voteAtoB, voteBtoA) {
  return voteAtoB === "interested" && voteBtoA === "interested";
}

/**
 * Menghitung seluruh mutual match dari kumpulan votes satu event.
 * @param {{voter_id:string, candidate_id:string, vote:string}[]} votes
 * @returns {[string,string][]} pasangan user id yang saling match (urut agar tidak duplikat)
 */
export function calculateMutualMatches(votes) {
  const map = new Map(); // key: `${voter}->${candidate}` => vote
  for (const v of votes) map.set(`${v.voter_id}->${v.candidate_id}`, v.vote);

  const seen = new Set();
  const matches = [];

  for (const v of votes) {
    if (v.vote !== "interested") continue;
    const reverse = map.get(`${v.candidate_id}->${v.voter_id}`);
    if (reverse === "interested") {
      const [a, b] = [v.voter_id, v.candidate_id].sort();
      const key = `${a}::${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push([a, b]);
      }
    }
  }

  return matches;
}
