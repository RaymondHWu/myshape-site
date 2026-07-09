import { getMDXPost, listMDXSlugs } from "@/lib/mdx";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import MDXPostClient from "./MDXPostClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return listMDXSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getMDXPost(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.subtitle,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.subtitle,
      images: [`/blog/og?title=${encodeURIComponent(post.frontmatter.title)}`],
    },
  };
}

export default async function MDXPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getMDXPost(slug);
  if (!post) notFound();

  return (
    <MDXPostClient
      title={post.frontmatter.title}
      subtitle={post.frontmatter.subtitle}
      date={post.frontmatter.date}
      series={post.frontmatter.series}
      content={post.content}
      slug={slug}
    />
  );
}
