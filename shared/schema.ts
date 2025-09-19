import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  position: text("position").notNull(),
  experience: integer("experience"), // years of experience
  skills: json("skills").$type<string[]>().default([]),
  resume: text("resume"), // file path or URL
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, hired, rejected, withdrawn
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  type: text("type").notNull(), // technical, behavioral, final, phone
  location: text("location"), // room or video link
  interviewerEmail: text("interviewer_email").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recordings = pgTable("recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  interviewId: varchar("interview_id").notNull().references(() => interviews.id),
  videoPath: text("video_path"), // file path to video recording
  audioPath: text("audio_path"), // file path to audio recording
  transcription: text("transcription"), // full transcription text
  duration: integer("duration"), // seconds
  size: integer("size"), // file size in bytes
  createdAt: timestamp("created_at").defaultNow(),
});

export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  interviewId: varchar("interview_id").notNull().references(() => interviews.id),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  technicalScore: decimal("technical_score", { precision: 3, scale: 1 }), // 0.0 to 10.0
  communicationScore: decimal("communication_score", { precision: 3, scale: 1 }),
  problemSolvingScore: decimal("problem_solving_score", { precision: 3, scale: 1 }),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  recommendation: text("recommendation"), // hire, no_hire, maybe
  feedback: text("feedback"),
  evaluatorEmail: text("evaluator_email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientEmail: text("recipient_email").notNull(),
  type: text("type").notNull(), // interview_reminder, interview_scheduled, evaluation_complete
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const candidatesRelations = relations(candidates, ({ many }) => ({
  interviews: many(interviews),
  evaluations: many(evaluations),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  recordings: many(recordings),
  evaluations: many(evaluations),
}));

export const recordingsRelations = relations(recordings, ({ one }) => ({
  interview: one(interviews, {
    fields: [recordings.interviewId],
    references: [interviews.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  interview: one(interviews, {
    fields: [evaluations.interviewId],
    references: [interviews.id],
  }),
  candidate: one(candidates, {
    fields: [evaluations.candidateId],
    references: [candidates.id],
  }),
}));

// Insert schemas
export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  sent: true,
  sentAt: true,
  createdAt: true,
});

// Types
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Legacy user schema for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
