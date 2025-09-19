import { 
  candidates, 
  interviews, 
  recordings, 
  evaluations, 
  notifications,
  users,
  type Candidate, 
  type InsertCandidate,
  type Interview,
  type InsertInterview,
  type Recording,
  type InsertRecording,
  type Evaluation,
  type InsertEvaluation,
  type Notification,
  type InsertNotification,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, count } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Candidate methods
  getCandidates(limit?: number, offset?: number, search?: string): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: string): Promise<void>;

  // Interview methods
  getInterviews(candidateId?: string, status?: string): Promise<Interview[]>;
  getInterview(id: string): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  getUpcomingInterviews(date: Date): Promise<Interview[]>;

  // Recording methods
  getRecordings(interviewId?: string): Promise<Recording[]>;
  getRecording(id: string): Promise<Recording | undefined>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  updateRecording(id: string, recording: Partial<InsertRecording>): Promise<Recording>;

  // Evaluation methods
  getEvaluations(candidateId?: string, interviewId?: string): Promise<Evaluation[]>;
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation>;

  // Notification methods
  getNotifications(recipientEmail?: string, sent?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationSent(id: string): Promise<void>;

  // Analytics methods
  getInterviewMetrics(): Promise<{
    totalInterviews: number;
    activeCandidates: number;
    weeklyInterviews: number;
    averageScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Candidate methods
  async getCandidates(limit = 50, offset = 0, search?: string): Promise<Candidate[]> {
    let query = db.select().from(candidates);
    
    if (search) {
      query = query.where(like(candidates.name, `%${search}%`)) as any;
    }
    
    return await query
      .orderBy(desc(candidates.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getCandidate(id: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate || undefined;
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db
      .insert(candidates)
      .values(candidate)
      .returning();
    return newCandidate;
  }

  async updateCandidate(id: string, candidate: Partial<InsertCandidate>): Promise<Candidate> {
    const [updated] = await db
      .update(candidates)
      .set(candidate)
      .where(eq(candidates.id, id))
      .returning();
    return updated;
  }

  async deleteCandidate(id: string): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  // Interview methods
  async getInterviews(candidateId?: string, status?: string): Promise<Interview[]> {
    let query = db.select().from(interviews);
    
    const conditions = [];
    if (candidateId) conditions.push(eq(interviews.candidateId, candidateId));
    if (status) conditions.push(eq(interviews.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(interviews.scheduledAt));
  }

  async getInterview(id: string): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview || undefined;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values({ ...interview, updatedAt: new Date() })
      .returning();
    return newInterview;
  }

  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    const [updated] = await db
      .update(interviews)
      .set({ ...interview, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  }

  async deleteInterview(id: string): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  async getUpcomingInterviews(date: Date): Promise<Interview[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(interviews)
      .where(
        and(
          gte(interviews.scheduledAt, startOfDay),
          lte(interviews.scheduledAt, endOfDay),
          eq(interviews.status, "scheduled")
        )
      )
      .orderBy(interviews.scheduledAt);
  }

  // Recording methods
  async getRecordings(interviewId?: string): Promise<Recording[]> {
    let query = db.select().from(recordings);
    
    if (interviewId) {
      query = query.where(eq(recordings.interviewId, interviewId)) as any;
    }
    
    return await query.orderBy(desc(recordings.createdAt));
  }

  async getRecording(id: string): Promise<Recording | undefined> {
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    return recording || undefined;
  }

  async createRecording(recording: InsertRecording): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values(recording)
      .returning();
    return newRecording;
  }

  async updateRecording(id: string, recording: Partial<InsertRecording>): Promise<Recording> {
    const [updated] = await db
      .update(recordings)
      .set(recording)
      .where(eq(recordings.id, id))
      .returning();
    return updated;
  }

  // Evaluation methods
  async getEvaluations(candidateId?: string, interviewId?: string): Promise<Evaluation[]> {
    let query = db.select().from(evaluations);
    
    const conditions = [];
    if (candidateId) conditions.push(eq(evaluations.candidateId, candidateId));
    if (interviewId) conditions.push(eq(evaluations.interviewId, interviewId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(evaluations.createdAt));
  }

  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return evaluation || undefined;
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEvaluation] = await db
      .insert(evaluations)
      .values({ ...evaluation, updatedAt: new Date() })
      .returning();
    return newEvaluation;
  }

  async updateEvaluation(id: string, evaluation: Partial<InsertEvaluation>): Promise<Evaluation> {
    const [updated] = await db
      .update(evaluations)
      .set({ ...evaluation, updatedAt: new Date() })
      .where(eq(evaluations.id, id))
      .returning();
    return updated;
  }

  // Notification methods
  async getNotifications(recipientEmail?: string, sent?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications);
    
    const conditions = [];
    if (recipientEmail) conditions.push(eq(notifications.recipientEmail, recipientEmail));
    if (sent !== undefined) conditions.push(eq(notifications.sent, sent));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationSent(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ sent: true, sentAt: new Date() })
      .where(eq(notifications.id, id));
  }

  // Analytics methods
  async getInterviewMetrics(): Promise<{
    totalInterviews: number;
    activeCandidates: number;
    weeklyInterviews: number;
    averageScore: number;
  }> {
    // Total interviews
    const [totalInterviewsResult] = await db
      .select({ count: count() })
      .from(interviews);
    
    // Active candidates
    const [activeCandidatesResult] = await db
      .select({ count: count() })
      .from(candidates)
      .where(eq(candidates.status, "active"));
    
    // Weekly interviews (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const [weeklyInterviewsResult] = await db
      .select({ count: count() })
      .from(interviews)
      .where(gte(interviews.scheduledAt, weekAgo));
    
    // Average score from evaluations
    const evaluationResults = await db
      .select({ overallScore: evaluations.overallScore })
      .from(evaluations)
      .where(eq(evaluations.overallScore, evaluations.overallScore)); // Not null check
    
    const averageScore = evaluationResults.length > 0
      ? evaluationResults.reduce((sum, evaluation) => sum + (parseFloat(evaluation.overallScore || "0")), 0) / evaluationResults.length
      : 0;
    
    return {
      totalInterviews: totalInterviewsResult.count,
      activeCandidates: activeCandidatesResult.count,
      weeklyInterviews: weeklyInterviewsResult.count,
      averageScore: Math.round(averageScore * 10) / 10,
    };
  }
}

export const storage = new DatabaseStorage();
