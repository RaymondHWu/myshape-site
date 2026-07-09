import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

export interface MDXFrontmatter {
  title: string;
  subtitle: string;
  date: string;
  tags: string[];
  category?: string;
  series?: string;
  featured?: boolean;
}

export async function getMDXPost(slug: string) {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter, content } = await compileMDX<MDXFrontmatter>({
    source,
    options: { parseFrontmatter: true },
  });

  return { frontmatter, content, slug };
}

export function listMDXSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function listMDXPosts() {
  const slugs = listMDXSlugs();
  const posts = await Promise.all(slugs.map((slug) => getMDXPost(slug)));
  return posts.filter(Boolean);
}
