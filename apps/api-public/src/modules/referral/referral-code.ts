// 6-char referral codes from a safe alphabet: no vowels (avoids accidental
// words), no confusable glyphs (0/O, 1/I/L), uppercase only (easy to type).
// 29^6 ≈ 594M codes — collisions are negligible, but callers still retry on the
// unique constraint to be correct.
const ALPHABET = "BCDFGHJKLMNPQRSTVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
