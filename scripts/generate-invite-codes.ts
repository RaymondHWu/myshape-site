/**
 * Generate 50 unique invite codes for the MyShape Genesis beta.
 *
 * Format: MYSHAPE-XXXX-XXXX (uppercase alphanumeric, no ambiguous chars)
 * Output: SQL INSERT statements ready for Supabase SQL Editor
 *
 * Usage: npx tsx scripts/generate-invite-codes.ts
 */

// No ambiguous characters: 0/O, 1/I/L
const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomChar(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

function randomSegment(length: number): string {
  return Array.from({ length }, () => randomChar()).join("");
}

function generateCode(): string {
  return `MYSHAPE-${randomSegment(4)}-${randomSegment(4)}`;
}

// Generate 50 unique codes
const codes = new Set<string>();
while (codes.size < 50) {
  codes.add(generateCode());
}

// Output as SQL INSERT
console.log("-- Generated invite codes for MyShape Genesis Beta\n");
console.log("INSERT INTO invite_codes (code) VALUES");

const lines = Array.from(codes).map((code, i) => {
  const comma = i < codes.size - 1 ? "," : ";";
  return `  ('${code}')${comma}`;
});

console.log(lines.join("\n"));

console.log("\n-- Verify count:");
console.log(`-- SELECT count(*) FROM invite_codes WHERE status = 'UNUSED'; -- should be 50`);
