"use client";

import { useMemo, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Article = {
  id: string;
  topic: string;
  title: string;
  slug: string;
  status: "pending" | "generating" | "completed" | "failed";
  wordCount?: number;
  url?: string;
  content?: string;
};

const INITIAL_TOPICS = ["The Future of AI in Business", "How to Build a Strong Brand"];

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function HomePage() {

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState("#6759E8");
  const [logoPreview, setLogoPreview] = useState("");
  const [topics, setTopics] = useState<string[]>(INITIAL_TOPICS);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "articles">("overview");
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = useMemo(
    () => articles.filter((article) => article.status === "completed").length,
    [articles]
  );

  function updateTopic(index: number, value: string) {
    setTopics((current) => current.map((topic, i) => (i === index ? value : topic)));
  }

  function addTopic() {
    if (topics.length >= 10) return;
    setTopics((current) => [...current, ""]);
  }

  function removeTopic(index: number) {
    setTopics((current) => current.filter((_, i) => i !== index));
  }

   function handleLogoChange(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];
  if (!file) return;

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setNotice("Choose a PNG, JPG, or WebP logo.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setNotice("Logo must be 2 MB or smaller.");
    event.target.value = "";
    return;
  }

  setLogoFile(file);

  const reader = new FileReader();

  reader.onload = () => {
    setLogoPreview(String(reader.result ?? ""));
  };

  reader.readAsDataURL(file);
  setNotice("");
}

  async function handleGenerate() {
  const cleanName = companyName.trim();
  const cleanTopics = topics
    .map((topic) => topic.trim())
    .filter(Boolean);

  if (!cleanName) {
    setNotice("Enter a company name before generating articles.");
    return;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(brandColor)) {
    setNotice("Enter a valid 6-digit hex color.");
    return;
  }

  if (cleanTopics.length === 0 || cleanTopics.length > 10) {
    setNotice("Enter between 1 and 10 blog topics.");
    return;
  }

  setIsGenerating(true);
  setNotice("Creating your project...");

  try {
    // 1. Create the project and upload its logo.
    const formData = new FormData();

    formData.append("name", cleanName);
    formData.append("brandColor", brandColor);

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const projectResponse = await fetch(
      `${API_BASE_URL}/api/projects`,
      {
        method: "POST",
        body: formData,
      }
    );

    const projectData = await projectResponse.json();

    if (!projectResponse.ok || !projectData.success) {
      throw new Error(
        projectData.message || "Failed to create project."
      );
    }

    const createdProject = projectData.project;
    setProjectId(createdProject.id);

    // 2. Generate articles using the existing backend endpoint.
    setNotice("Project created. Generating your articles...");

    const articleResponse = await fetch(
      `${API_BASE_URL}/api/projects/${createdProject.id}/articles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topics: cleanTopics,
        }),
      }
    );

    const articleData = await articleResponse.json();

    if (!articleResponse.ok || !articleData.success) {
      throw new Error(
        articleData.message || "Article generation failed."
      );
    }

    // 3. Convert the API response to your existing UI's data format.
    const generatedArticles: Article[] = (
      articleData.articles || []
    ).map(
      (article: {
        id: string;
        topic: string;
        slug: string;
        content: string;
        status: string;
      }) => ({
        id: article.id,
        topic: article.topic,
        title: article.topic,
        slug: article.slug,
        url: `/articles/${article.slug}`,
        content: article.content,
        status: article.status.toLowerCase() as Article["status"],
      })
    );

    setArticles(generatedArticles);
    setActiveTab("articles");

    const succeeded =
      articleData.succeeded ??
      generatedArticles.filter(
        (article) => article.status === "completed"
      ).length;

    const failed =
      articleData.failed ??
      generatedArticles.filter(
        (article) => article.status === "failed"
      ).length;

    setNotice(
      `Generation finished: ${succeeded} completed, ${failed} failed.`
    );
  } catch (error) {
    setNotice(
      error instanceof Error
        ? `Error: ${error.message}. Check your backend and CORS configuration.`
        : "Something went wrong while generating articles."
    );
  } finally {
    setIsGenerating(false);
  }
}

  function simulatePreviewGeneration() {
    // This button deliberately does not fake a successful AI response.
    void isGenerating;
    void setIsGenerating;
    setNotice("Connect this action to POST /api/generate to run real AI generation.");
  }

  return (
    <main className="min-h-screen bg-[#F7F8FC] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:flex lg:flex-col">
          <a href="#" className="mb-10 flex items-center gap-3 px-2">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              P
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">pageora</span>
              <span className="block text-xs text-slate-500">AI publishing studio</span>
            </span>
          </a>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <GridIcon /> Overview
            </button>
            <button
              onClick={() => setActiveTab("articles")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                activeTab === "articles"
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FileIcon /> Generated articles
              {articles.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                  {articles.length}
                </span>
              )}
            </button>
          </nav>

          <div className="mt-auto rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm">
              <SparkleIcon />
            </div>
            <p className="text-sm font-bold">Your content, on-brand.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Turn a list of ideas into a consistent publishing workflow.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
              PG
            </div>
            <div>
              <p className="text-sm font-semibold">Personal workspace</p>
              <p className="text-xs text-slate-400">Starter plan</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-9">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="lg:hidden font-bold text-slate-900">pageora</span>
              <span className="hidden lg:inline">Workspace</span>
              <span className="hidden lg:inline">/</span>
              <span className="font-semibold text-slate-800">
                {activeTab === "overview" ? "Create a project" : "Generated articles"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Workspace ready
              </span>
              <button
                aria-label="Help"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                onClick={() =>
                  setNotice("Tip: add your brand details and at least one topic to preview the publishing workflow.")
                }
              >
                <HelpIcon />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-8 md:px-9 md:py-10">
            {activeTab === "overview" ? (
              <>
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
                      <SparkleIcon /> AI-powered publishing
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-[38px]">
                      Create your next <span className="text-violet-600">content hub.</span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                      Set your brand once. Turn up to 10 topics into beautifully branded blog pages.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldIcon /> Your brand settings stay with each project
                  </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                      <div className="mb-6 flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <BrandIcon />
                        </div>
                        <div>
                          <h2 className="font-bold text-slate-900">Brand identity</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            Give your content a consistent look and feel.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">
                            Company name <span className="text-rose-500">*</span>
                          </span>
                          <input
                            value={companyName}
                            onChange={(event) => setCompanyName(event.target.value)}
                            placeholder="e.g. Acme Technologies"
                            maxLength={100}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                          />
                        </label>

                        <div>
                          <span className="mb-2 block text-sm font-semibold text-slate-700">
                            Brand colour <span className="text-rose-500">*</span>
                          </span>
                          <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-2">
                            <input
                              type="color"
                              value={/^#[0-9A-Fa-f]{6}$/.test(brandColor) ? brandColor : "#6759E8"}
                              onChange={(event) => setBrandColor(event.target.value.toUpperCase())}
                              aria-label="Choose brand colour"
                              className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <input
                              value={brandColor}
                              onChange={(event) => setBrandColor(event.target.value)}
                              placeholder="#6759E8"
                              maxLength={7}
                              aria-label="Brand colour hex value"
                              className="min-w-0 flex-1 border-0 bg-transparent font-mono text-sm uppercase outline-none"
                            />
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                              HEX
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">
                          Company logo
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 transition hover:border-violet-400 hover:bg-violet-50/40 sm:flex-row sm:justify-start sm:gap-4"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                            {logoPreview ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain p-1" />
                            ) : (
                              <UploadIcon />
                            )}
                          </div>
                          <span className="mt-3 text-center sm:mt-0 sm:text-left">
                            <span className="block text-sm font-semibold text-slate-700">
                              {logoPreview ? "Change logo" : "Click to upload your logo"}
                            </span>
                            <span className="mt-1 block text-xs text-slate-400">
                              PNG, JPG, or WebP · Max 2 MB
                            </span>
                          </span>
                          <span className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:ml-auto sm:mt-0">
                            Browse files
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                      <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                            <ListIcon />
                          </div>
                          <div>
                            <h2 className="font-bold text-slate-900">Blog topics</h2>
                            <p className="mt-1 text-sm text-slate-500">
                              Each topic becomes its own published article.
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                          {topics.length}/10
                        </span>
                      </div>

                      <div className="space-y-3">
                        {topics.map((topic, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-400">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <input
                              value={topic}
                              onChange={(event) => updateTopic(index, event.target.value)}
                              placeholder={`Enter blog topic ${index + 1}`}
                              maxLength={180}
                              aria-label={`Blog topic ${index + 1}`}
                              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                            />
                            <button
                              type="button"
                              aria-label={`Remove topic ${index + 1}`}
                              onClick={() => removeTopic(index)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={topics.length >= 10}
                        onClick={addTopic}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <PlusIcon /> Add another topic
                      </button>
                    </div>

                    {notice && (
                      <div
                        role="status"
                        className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-800"
                      >
                        {notice}
                      </div>
                    )}

                    <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                      <p className="text-xs leading-5 text-slate-400">
                        You can review each article before sharing its public link.
                      </p>
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60"
                        style={{ backgroundColor: brandColor }}
                      >
                        <SparkleIcon /> Generate blog pages <ArrowRightIcon />
                      </button>
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold">Live brand preview</h3>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Preview</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white"
                              style={{ backgroundColor: brandColor }}
                            >
                              {logoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoPreview} alt="" className="h-full w-full bg-white object-contain" />
                              ) : (
                                companyName.trim().slice(0, 1).toUpperCase() || "B"
                              )}
                            </div>
                            <span className="truncate text-xs font-bold">
                              {companyName.trim() || "Your company"}
                            </span>
                          </div>
                          <div className="p-4">
                            <div
                              className="mb-3 h-24 rounded-lg"
                              style={{
                                background: `linear-gradient(135deg, ${brandColor}, ${brandColor}99)`,
                              }}
                            />
                            <span
                              className="inline-flex rounded-full px-2 py-1 text-[9px] font-bold"
                              style={{ color: brandColor, backgroundColor: `${brandColor}15` }}
                            >
                              INSIGHTS
                            </span>
                            <h4 className="mt-2 text-base font-bold leading-snug">
                              {topics.find((topic) => topic.trim()) || "Your next great article"}
                            </h4>
                            <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-slate-500">
                              Thoughtful ideas, useful insights, and fresh perspectives from{" "}
                              {companyName.trim() || "your team"}.
                            </p>
                            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                              <div className="h-5 w-5 rounded-full bg-slate-100" />
                              <span className="text-[10px] text-slate-400">5 min read</span>
                              <span className="ml-auto text-[10px] font-bold" style={{ color: brandColor }}>
                                Read article ↗
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                          Your logo and brand colour will appear on every generated page.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-bold">How it works</h3>
                      <div className="mt-4 space-y-4">
                        {[
                          ["01", "Set your brand", "Add your company details and visual identity."],
                          ["02", "Generate content", "Create a structured article for each topic."],
                          ["03", "Publish pages", "Share a unique public link for every article."],
                        ].map(([number, title, description]) => (
                          <div key={number} className="flex gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-xs font-bold text-slate-500">
                              {number}
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900 p-5 text-white">
                      <div className="flex items-center gap-2 text-violet-300">
                        <SparkleIcon />
                        <span className="text-xs font-bold uppercase tracking-wider">Made for scale</span>
                      </div>
                      <p className="mt-3 text-lg font-bold">One project. Up to 10 articles.</p>
                      <p className="mt-2 text-xs leading-5 text-slate-300">
                        Keep every company’s content and branding organised independently.
                      </p>
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              <div>
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-violet-700">Your content library</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">Generated articles</h1>
                    <p className="mt-2 text-sm text-slate-500">
                      Review article status and open public pages when generation is connected.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
                  >
                    <PlusIcon /> New project
                  </button>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Total topics", String(articles.length), "Across this project"],
                    ["Completed", String(completedCount), "Articles generated"],
                    ["In progress", String(articles.filter((article) => article.status === "generating").length), "Currently generating"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm text-slate-500">{label}</p>
                      <p className="mt-2 text-3xl font-bold">{value}</p>
                      <p className="mt-1 text-xs text-slate-400">{detail}</p>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="font-bold">Project articles</h2>
                    <span className="text-xs text-slate-400">{articles.length} topics</span>
                  </div>
                  {articles.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <FileIcon />
                      </div>
                      <h3 className="mt-4 font-bold">No articles yet</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Create a project and add topics to start building your content library.
                      </p>
                      <button
                        onClick={() => setActiveTab("overview")}
                        className="mt-5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white"
                      >
                        Create a project
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {articles.map((article, index) => (
                        <div key={article.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-500">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">{article.title}</p>
                            <p className="mt-1 truncate text-xs text-slate-400">/{article.slug}</p>
                          </div>
                          <StatusBadge status={article.status} />
                          {article.status === "completed" && article.url ? (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
                            >
                              Open page <ArrowRightIcon />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">API connection required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notice && (
                  <p role="status" className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-800">
                    {notice}
                  </p>
                )}
                <button onClick={simulatePreviewGeneration} className="mt-5 text-xs text-slate-400 underline">
                  View integration note
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: Article["status"] }) {
  const styles = {
    pending: "bg-slate-100 text-slate-600",
    generating: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-rose-50 text-rose-700",
  };
  const labels = {
    pending: "Pending",
    generating: "Generating",
    completed: "Completed",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${styles[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

function GridIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>;
}
function FileIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8"><path d="M13 3.5H6.5A2.5 2.5 0 0 0 4 6v12a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18V10z"/><path d="M13 3.5V10h7M8 14h8M8 17h6"/></svg>;
}
function SparkleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z"/></svg>;
}
function HelpIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.5 1.8c-1.1 1-2 1.3-2 2.7M12 17h.01"/></svg>;
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
}
function BrandIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 15.5V8.5h4.5a2 2 0 0 1 0 4H8m4.5 0 3.5 3"/></svg>;
}
function UploadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m-4 4 4-4 4 4"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>;
}
function ListIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-[17px] w-[17px]" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>;
}
function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
}
function ArrowRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
}
