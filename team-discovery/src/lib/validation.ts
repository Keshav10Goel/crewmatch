import { z } from "zod";

export const profileSchema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-z0-9_]+$/i, "Use letters, numbers, and underscores only."),
  full_name: z.string().trim().min(2).max(80),
  headline: z.string().trim().max(120).optional().default(""),
  bio: z.string().trim().max(700).optional().default(""),
  skills: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  interests: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  goals: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  looking_for: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  availability_hours: z.number().int().min(0).max(80).nullable().optional(),
  discoverability: z.enum(["everyone", "relevant", "unavailable", "hidden"]).default("relevant")
});

export const opportunitySchema = z.object({
  title: z.string().trim().min(5).max(120),
  summary: z.string().trim().min(15).max(300),
  description: z.string().trim().min(30).max(8000),
  category: z.enum(["Hackathon", "College Project", "AI/ML", "Web Development", "Startup", "Open Source", "Research", "Social Impact", "Other"]),
  required_skills: z.array(z.string().trim().min(1)).min(1).max(20),
  preferred_skills: z.array(z.string().trim().min(1)).max(20).default([]),
  open_roles: z.array(z.string().trim().min(1)).min(1).max(10),
  weekly_hours: z.number().int().min(1).max(80),
  collaboration_mode: z.enum(["Remote", "Hybrid", "In person"]),
  duration: z.string().min(2).max(80),
  deadline: z.string().optional().nullable()
});
