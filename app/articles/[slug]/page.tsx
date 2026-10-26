
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Article = {
  id: string;
  topic: string;
  slug: string;
  content: string;
  status: string;
  project: {
    name: string;
    logoUrl: string | null;
    brandColor: string;
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/projects/articles/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.success ? data.article : null;
  } catch {
    return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Article not found
        </h1>

        <p className="mt-3 text-gray-600">
          This article may not exist or may not be available yet.
        </p>

        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-white hover:opacity-90"
        >
          Back to BrandPress
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header
        className="border-b bg-white px-6 py-5"
        style={{ borderBottomColor: article.project.brandColor }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          {article.project.logoUrl && (
            <img
              src={article.project.logoUrl}
              alt={`${article.project.name} logo`}
              className="h-10 w-10 rounded-lg object-contain"
            />
          )}

          <span className="text-xl font-bold text-gray-900">
            {article.project.name}
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Back to BrandPress
        </Link>

        <h1
          className="mt-8 text-4xl font-bold leading-tight"
          style={{ color: article.project.brandColor }}
        >
          {article.topic}
        </h1>

        <div className="mt-6 flex items-center gap-3">
  {article.project.logoUrl && (
    <img
      src={article.project.logoUrl}
      alt={`${article.project.name} logo`}
      className="h-12 w-12 rounded-lg object-contain"
    />
  )}

  <div>
    <p className="font-semibold text-gray-900">
      {article.project.name}
    </p>
    <p className="text-sm text-gray-500">
      Published article
    </p>
      </div>
   </div>

        <div className="mt-10 break-words text-base leading-8 text-gray-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h2 className="mb-5 mt-10 text-3xl font-bold leading-tight text-gray-900">
                  {children}
                </h2>
              ),

              h2: ({ children }) => (
                <h2 className="mb-4 mt-9 text-2xl font-bold leading-tight text-gray-900">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-3 mt-7 text-xl font-semibold text-gray-900">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-5 leading-8 text-gray-700">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="mb-6 list-disc space-y-2 pl-7 text-gray-700">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-6 list-decimal space-y-2 pl-7 text-gray-700">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="pl-1">{children}</li>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">
                  {children}
                </strong>
              ),

              blockquote: ({ children }) => (
                <blockquote
                  className="my-6 border-l-4 pl-5 italic text-gray-600"
                  style={{ borderColor: article.project.brandColor }}
                >
                  {children}
                </blockquote>
              ),

              a: ({ href, children }) => {
                const safeHref =
                  href &&
                  (/^https?:\/\//i.test(href) ||
                    href.startsWith("/") ||
                    href.startsWith("#"))
                    ? href
                    : undefined;

                return (
                  <a
                    href={safeHref}
                    target={
                      safeHref?.startsWith("http") ? "_blank" : undefined
                    }
                    rel={
                      safeHref?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="underline underline-offset-4"
                    style={{ color: article.project.brandColor }}
                  >
                    {children}
                  </a>
                );
              },

              table: ({ children }) => (
                <div className="my-7 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full border-collapse text-left text-sm">
                    {children}
                  </table>
                </div>
              ),

              thead: ({ children }) => (
                <thead className="bg-gray-100 text-gray-900">
                  {children}
                </thead>
              ),

              th: ({ children }) => (
                <th className="border-b border-gray-200 px-4 py-3 font-semibold">
                  {children}
                </th>
              ),

              td: ({ children }) => (
                <td className="border-b border-gray-100 px-4 py-3">
                  {children}
                </td>
              ),

              hr: () => (
                <hr className="my-8 border-gray-200" />
              ),

              code: ({ children }) => (
                <code className="rounded bg-gray-100 px-1.5 py-1 font-mono text-sm text-gray-800">
                  {children}
                </code>
              ),
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>

        <footer className="mt-14 border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            Published by {article.project.name}
          </p>

          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium hover:underline"
            style={{ color: article.project.brandColor }}
          >
            ← Back to BrandPress
          </Link>
        </footer>
      </article>
    </main>
  );
}
