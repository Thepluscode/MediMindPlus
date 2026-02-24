import { Request, Response } from 'express';
import { HealthAnalysisService } from '../services/HealthAnalysisService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Multer configuration for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedAudioTypes = /m4a|mp3|wav|aac/;
    const allowedImageTypes = /jpg|jpeg|png/;
    const extname = path.extname(file.originalname).toLowerCase().slice(1);

    if (file.fieldname === 'audio' && allowedAudioTypes.test(extname)) {
      cb(null, true);
    } else if (file.fieldname === 'frames' && allowedImageTypes.test(extname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export class HealthAnalysisController {
  private service: HealthAnalysisService;

  constructor() {
    this.service = new HealthAnalysisService();
  }

  /**
   * Analyze voice biomarkers from audio file
   * POST /api/voice/analyze
   */
  analyzeVoice = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // File is uploaded via multer middleware
      const audioFile = (req as any).file;
      if (!audioFile) {
        res.status(400).json({ error: 'No audio file provided' });
        return;
      }

      logger.info(`Analyzing voice for user ${userId}`, {
        filename: audioFile.filename,
        size: audioFile.size,
      });

      // Process voice analysis
      const result = await this.service.analyzeVoice(userId, audioFile.path);

      // Clean up uploaded file
      await fs.unlink(audioFile.path);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Voice analysis failed:', error);
      res.status(500).json({
        error: 'Voice analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Analyze health markers from camera frames
   * POST /api/camera/analyze
   */
  analyzeCameraFrames = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Multiple frames uploaded via multer
      const frames = (req as any).files;
      if (!frames || frames.length === 0) {
        res.status(400).json({ error: 'No frames provided' });
        return;
      }

      const { frameCount, timestamp } = req.body;

      logger.info(`Analyzing ${frames.length} camera frames for user ${userId}`);

      // Process camera analysis
      const framePaths = frames.map((f: Express.Multer.File) => f.path);
      const result = await this.service.analyzeCameraFrames(userId, framePaths, {
        frameCount: parseInt(frameCount) || frames.length,
        timestamp: timestamp || new Date().toISOString(),
      });

      // Clean up uploaded frames
      for (const framePath of framePaths) {
        await fs.unlink(framePath);
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Camera analysis failed:', error);
      res.status(500).json({
        error: 'Camera analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get health metrics for a user
   * GET /api/health-metrics
   */
  getHealthMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { days = 7 } = req.query;

      const metrics = await this.service.getHealthMetrics(userId, parseInt(days as string));

      res.status(200).json({ metrics });
    } catch (error) {
      logger.error('Failed to fetch health metrics:', error);
      res.status(500).json({
        error: 'Failed to fetch health metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Save health metrics
   * POST /api/health-metrics
   */
  saveHealthMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const HealthMetricsSchema = z.object({
        metrics: z.object({
          heartRate: z.number().optional(),
          heartRateVariability: z.number().optional(),
          steps: z.number().optional(),
          activeEnergyBurned: z.number().optional(),
          bloodPressure: z.object({
            systolic: z.number(),
            diastolic: z.number(),
          }).optional(),
          bloodGlucose: z.number().optional(),
          bodyTemperature: z.number().optional(),
          oxygenSaturation: z.number().optional(),
          respiratoryRate: z.number().optional(),
          sleepAnalysis: z.object({
            asleep: z.number(),
            awake: z.number(),
            inBed: z.number(),
          }).optional(),
          weight: z.number().optional(),
          height: z.number().optional(),
          bmi: z.number().optional(),
        }),
        timestamp: z.string(),
        source: z.enum(['apple_health', 'google_fit', 'manual', 'device']),
      });

      const validatedData = HealthMetricsSchema.parse(req.body);

      const result = await this.service.saveHealthMetrics(
        userId,
        validatedData.metrics,
        validatedData.source,
        validatedData.timestamp
      );

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
        return;
      }

      logger.error('Failed to save health metrics:', error);
      res.status(500).json({
        error: 'Failed to save health metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get infection risk score
   * GET /api/infection/risk-score
   */
  getInfectionRiskScore = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const riskScore = await this.service.calculateInfectionRisk(userId);

      res.status(200).json(riskScore);
    } catch (error) {
      logger.error('Failed to calculate infection risk:', error);
      res.status(500).json({
        error: 'Failed to calculate infection risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get early warning signals
   * GET /api/infection/early-warnings
   */
  getEarlyWarnings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const warnings = await this.service.getEarlyWarnings(userId);

      res.status(200).json({ warnings });
    } catch (error) {
      logger.error('Failed to fetch early warnings:', error);
      res.status(500).json({
        error: 'Failed to fetch early warnings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get nearby outbreaks
   * GET /api/infection/outbreaks
   */
  getNearbyOutbreaks = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { latitude, longitude, radius = 50 } = req.query;

      const outbreaks = await this.service.getNearbyOutbreaks({
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radius: parseFloat(radius as string),
      });

      res.status(200).json({ outbreaks });
    } catch (error) {
      logger.error('Failed to fetch outbreaks:', error);
      res.status(500).json({
        error: 'Failed to fetch outbreaks',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get infection biometrics history
   * GET /api/infection/biometrics
   */
  getInfectionBiometrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { days = 7 } = req.query;

      const biometrics = await this.service.getInfectionBiometrics(userId, parseInt(days as string));

      res.status(200).json({ biometrics });
    } catch (error) {
      logger.error('Failed to fetch infection biometrics:', error);
      res.status(500).json({
        error: 'Failed to fetch infection biometrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get cancer screening data
   * GET /api/cancer/screening
   */
  getCancerScreening = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const screeningData = await this.service.getCancerScreening(userId);

      res.status(200).json(screeningData);
    } catch (error) {
      logger.error('Failed to fetch cancer screening data:', error);
      res.status(500).json({
        error: 'Failed to fetch cancer screening data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get genetic risk assessment
   * GET /api/cancer/genetic-risk
   */
  getGeneticRisk = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const geneticRisk = await this.service.getGeneticRisk(userId);

      res.status(200).json(geneticRisk);
    } catch (error) {
      logger.error('Failed to fetch genetic risk:', error);
      res.status(500).json({
        error: 'Failed to fetch genetic risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// Export multer middleware for routes
export const uploadAudio = upload.single('audio');
export const uploadFrames = upload.array('frames', 50);
