import { execSync } from "child_process";
import { readFileSync } from "fs";

const body = readFileSync("continuity-protocol/DISCUSSION_POST.md", "utf-8")
  .replace(/\\/g, "\\\\")
  .replace(/"/g, '\\"')
  .replace(/\n/g, "\\n")
  .replace(/\r/g, "");

const query = `mutation {
  createDiscussion(input: {
    repositoryId: "R_kgDOTFMrJs",
    categoryId: "DIC_kwDOTFMrJs4DA5L8",
    title: "[Challenge] Implement CPS-0001 from spec alone",
    body: "${body}"
  }) {
    discussion { url }
  }
}`;

const result = execSync(`gh api graphql -f query=${JSON.stringify(query)}`, { encoding: "utf-8" });
const data = JSON.parse(result);
if (data.errors) {
  console.error("Error:", JSON.stringify(data.errors, null, 2));
  process.exit(1);
}
console.log("Posted:", data.data.createDiscussion.discussion.url);
