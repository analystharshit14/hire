import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { transcribeAudio, analyzeInterviewPerformance, generateInterviewSummary } from "./services/openai";
import { sendEmail } from "./services/sendgrid";
import { 
  insertCandidateSchema, 
  insertInterviewSchema, 
  insertRecordingSchema, 
  insertEvaluationSchema,
  insertNotificationSchema 
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Candidates routes
  app.get("/api/candidates", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const candidates = await storage.getCandidates(limit, offset, search);
      res.json(candidates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const candidate = await storage.getCandidate(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(candidateData);
      res.status(201).json(candidate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/candidates/:id", async (req, res) => {
    try {
      const candidateData = insertCandidateSchema.partial().parse(req.body);
      const candidate = await storage.updateCandidate(req.params.id, candidateData);
      res.json(candidate);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/candidates/:id", async (req, res) => {
    try {
      await storage.deleteCandidate(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Interviews routes
  app.get("/api/interviews", async (req, res) => {
    try {
      const candidateId = req.query.candidateId as string;
      const status = req.query.status as string;
      const interviews = await storage.getInterviews(candidateId, status);
      res.json(interviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/interviews/:id", async (req, res) => {
    try {
      const interview = await storage.getInterview(req.params.id);
      if (!interview) {
        return res.status(404).json({ error: "Interview not found" });
      }
      res.json(interview);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/interviews", async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.parse(req.body);
      const interview = await storage.createInterview(interviewData);
      
      // Send notification email
      const candidate = await storage.getCandidate(interview.candidateId);
      if (candidate) {
        const emailContent = `
          Dear ${candidate.name},
          
          Your interview for the ${candidate.position} position has been scheduled for ${new Date(interview.scheduledAt).toLocaleString()}.
          
          Duration: ${interview.duration} minutes
          Type: ${interview.type}
          ${interview.location ? `Location: ${interview.location}` : ''}
          
          Please be prepared and arrive on time.
          
          Best regards,
          InterviewGuru Team
        `;
        
        await sendEmail(
          process.env.SENDGRID_API_KEY || "",
          {
            to: candidate.email,
            from: "noreply@interviewguru.com",
            subject: "Interview Scheduled",
            text: emailContent,
          }
        );
      }
      
      res.status(201).json(interview);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/interviews/:id", async (req, res) => {
    try {
      const interviewData = insertInterviewSchema.partial().parse(req.body);
      const interview = await storage.updateInterview(req.params.id, interviewData);
      res.json(interview);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/interviews/upcoming/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const interviews = await storage.getUpcomingInterviews(date);
      res.json(interviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Recordings routes
  app.get("/api/recordings", async (req, res) => {
    try {
      const interviewId = req.query.interviewId as string;
      const recordings = await storage.getRecordings(interviewId);
      res.json(recordings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/recordings", upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const recordingData = insertRecordingSchema.parse(req.body);
      
      // Handle file paths
      if (files.video) {
        recordingData.videoPath = files.video[0].path;
      }
      if (files.audio) {
        recordingData.audioPath = files.audio[0].path;
      }
      
      const recording = await storage.createRecording(recordingData);
      
      // If audio file was uploaded, transcribe it
      if (files.audio) {
        try {
          const transcriptionResult = await transcribeAudio(files.audio[0].path);
          await storage.updateRecording(recording.id, {
            transcription: transcriptionResult.text,
            duration: transcriptionResult.duration,
          });
        } catch (transcriptionError) {
          console.error("Transcription failed:", transcriptionError);
        }
      }
      
      res.status(201).json(recording);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/recordings/:id/transcribe", async (req, res) => {
    try {
      const recording = await storage.getRecording(req.params.id);
      if (!recording || !recording.audioPath) {
        return res.status(404).json({ error: "Recording or audio file not found" });
      }
      
      const transcriptionResult = await transcribeAudio(recording.audioPath);
      const updatedRecording = await storage.updateRecording(recording.id, {
        transcription: transcriptionResult.text,
        duration: transcriptionResult.duration,
      });
      
      res.json(updatedRecording);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Evaluations routes
  app.get("/api/evaluations", async (req, res) => {
    try {
      const candidateId = req.query.candidateId as string;
      const interviewId = req.query.interviewId as string;
      const evaluations = await storage.getEvaluations(candidateId, interviewId);
      res.json(evaluations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/evaluations", async (req, res) => {
    try {
      const evaluationData = insertEvaluationSchema.parse(req.body);
      const evaluation = await storage.createEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/evaluations/analyze", async (req, res) => {
    try {
      const { transcription, interviewId, candidateId, evaluatorEmail } = req.body;
      
      if (!transcription) {
        return res.status(400).json({ error: "Transcription is required" });
      }
      
      const analysis = await analyzeInterviewPerformance(transcription);
      
      // Create evaluation record
      const evaluation = await storage.createEvaluation({
        interviewId,
        candidateId,
        evaluatorEmail,
        technicalScore: analysis.technicalScore.toString(),
        communicationScore: analysis.communicationScore.toString(),
        problemSolvingScore: analysis.problemSolvingScore.toString(),
        overallScore: analysis.overallScore.toString(),
        strengths: analysis.strengths.join(", "),
        weaknesses: analysis.weaknesses.join(", "),
        recommendation: analysis.recommendation,
        feedback: await generateInterviewSummary(transcription),
      });
      
      res.json(evaluation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics routes
  app.get("/api/analytics/metrics", async (req, res) => {
    try {
      const metrics = await storage.getInterviewMetrics();
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const recipientEmail = req.query.recipientEmail as string;
      const sent = req.query.sent === "true" ? true : req.query.sent === "false" ? false : undefined;
      const notifications = await storage.getNotifications(recipientEmail, sent);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      
      // Send the email
      const success = await sendEmail(
        process.env.SENDGRID_API_KEY || "",
        {
          to: notification.recipientEmail,
          from: "noreply@interviewguru.com",
          subject: notification.subject,
          text: notification.content,
        }
      );
      
      if (success) {
        await storage.markNotificationSent(notification.id);
      }
      
      res.status(201).json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
