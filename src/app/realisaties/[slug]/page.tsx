import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectLayout from "@/components/ProjectLayout";
import { getNewProject, NEW_PROJECTS, newProjectHref, newProjectProducts } from "@/lib/realisaties";

/*
 * A customer project added after the WordPress site (src/lib/realisaties.ts):
 * text and Natuurhout's own photos. New URLs, not in the WordPress inventory.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return NEW_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getNewProject((await params).slug);
  if (!project) return {};
  const canonical = `https://www.natuurhout.be/realisaties/${project.slug}/`;
  return {
    title: `${project.title} | Natuurhout`,
    description: project.summary,
    alternates: { canonical },
    openGraph: {
      title: `${project.title} | Natuurhout`,
      description: project.summary,
      url: canonical,
      locale: "nl_BE",
      type: "article",
      images: [{ url: project.photos[0].src, width: project.photos[0].width, height: project.photos[0].height }],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = getNewProject((await params).slug);
  if (!project) notFound();
  const index = NEW_PROJECTS.indexOf(project);
  const nav = [
    NEW_PROJECTS[index - 1] && { href: newProjectHref(NEW_PROJECTS[index - 1]), rel: "prev" as const, title: NEW_PROJECTS[index - 1].title },
    NEW_PROJECTS[index + 1] && { href: newProjectHref(NEW_PROJECTS[index + 1]), rel: "next" as const, title: NEW_PROJECTS[index + 1].title },
  ].filter((link): link is { href: string; rel: "prev" | "next"; title: string } => Boolean(link));

  return (
    <ProjectLayout
      title={project.title}
      description={project.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      products={newProjectProducts(project)}
      photos={project.photos}
      nav={nav}
    />
  );
}
