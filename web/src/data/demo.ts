import type { Channel, ContentStatus, IdeaStatus } from "@/domain/content-system";

export type DemoIdea = {
  id: string;
  channel: Channel;
  topic: string;
  approach: string;
  category: string;
  format: string;
  whyNow: string;
  evidence: string;
  sources: string[];
  gates: string[];
  status: IdeaStatus;
  g9Passed: boolean;
};

export const demoIdeas: DemoIdea[] = [
  {
    id: "ig-1",
    channel: "instagram",
    topic: "Remote-ready proof before the application form",
    approach: "Turn a vague remote-job checklist into four pieces of evidence a fresher can actually prepare.",
    category: "Global applications",
    format: "Reel",
    whyNow: "Applicants often optimise location filters before proving they can work across time zones and async teams.",
    evidence: "Cross-check remote-employer guidance, applicant conversations and current distributed-work research.",
    sources: ["Primary sources", "LinkedIn", "Reddit"],
    gates: ["G1 prelim pass", "G2 n/a"],
    status: "surfaced",
    g9Passed: false,
  },
  {
    id: "ig-2",
    channel: "instagram",
    topic: "A country-specific resume is not a translation exercise",
    approach: "Compare the decisions behind format, photo, length and evidence without pretending one template fits a country.",
    category: "Country resumes",
    format: "Carousel",
    whyNow: "Country-resume advice is usually flattened into folklore. The useful question is what the employer needs to assess.",
    evidence: "Use official application guidance and named recruitment sources; preserve jurisdiction limits.",
    sources: ["Official guidance", "YouTube", "Specialist sites"],
    gates: ["G1 prelim pass", "Legal orientation"],
    status: "surfaced",
    g9Passed: false,
  },
  {
    id: "ig-3",
    channel: "instagram",
    topic: "Your outreach message needs a reason to reply",
    approach: "Show the difference between asking for a job and offering a specific, low-friction conversation.",
    category: "Outreach",
    format: "Reel",
    whyNow: "Freshers are copying outreach templates that remove the only useful part: a real reason for this person and role.",
    evidence: "Triangulate recruiter observations with public outreach examples and applicant responses.",
    sources: ["X", "LinkedIn", "Instagram"],
    gates: ["G1 prelim pass", "No invented quote"],
    status: "surfaced",
    g9Passed: false,
  },
  {
    id: "ig-4",
    channel: "instagram",
    topic: "Read the contractor clause before you celebrate the rate",
    approach: "Explain five questions about hours, exclusivity, currency, tax responsibility and termination as sourced orientation.",
    category: "Contractor routes",
    format: "Carousel",
    whyNow: "A headline rate cannot be compared safely until the working and payment terms are understood.",
    evidence: "Use official tax/employment orientation and contractor-platform guidance, never individual legal advice.",
    sources: ["Primary sources", "Reddit", "News search"],
    gates: ["G1 prelim pass", "Legal limitation"],
    status: "surfaced",
    g9Passed: false,
  },
];

export type DemoContent = {
  id: string;
  channel: Channel;
  topic: string;
  category: string;
  format: string;
  status: ContentStatus | "validating" | "needs_review";
  sync: "synced" | "pending" | "failed";
};

export const demoPipeline: DemoContent[] = [
  { id: "p1", channel: "linkedin", topic: "Remote-ready proof before location filters", category: "Global applications", format: "Text post", status: "validating", sync: "pending" },
  { id: "p2", channel: "instagram", topic: "Country resume decisions", category: "Country resumes", format: "Carousel", status: "approved_topic", sync: "synced" },
  { id: "p3", channel: "x", topic: "A four-line outreach check", category: "Outreach", format: "Thread", status: "drafting", sync: "synced" },
  { id: "p4", channel: "linkedin", topic: "What contractor rates hide", category: "Contractor routes", format: "Document post", status: "review", sync: "synced" },
  { id: "p5", channel: "instagram", topic: "Build one proof bank", category: "Resume preparation", format: "Reel", status: "ready", sync: "synced" },
];
