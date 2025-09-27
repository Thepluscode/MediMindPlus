import { Request, Response } from 'express';
import { MLService, PatientMLInput } from '../services/MLService';
import { logger } from '../utils/logger';

export class MLController {
  private mlService: MLService;

  constructor() {
    this.mlService = new MLService();
  }

  public getHealth = async (req: Request, res: Response) => {
    try {
      const isHealthy = await this.mlService.getHealth();
      if (isHealthy) {
        res.status(200).json({ status: 'healthy', service: 'ml' });
      } else {
        res.status(503).json({ status: 'unavailable', service: 'ml' });
      }
    } catch (error) {
      logger.error('Error checking ML service health:', error);
      res.status(500).json({ error: 'Failed to check ML service health' });
    }
  };

  public analyzePatient = async (req: Request, res: Response) => {
    try {
      const patientData: PatientMLInput = req.body;
      
      // Basic validation
      if (!patientData.user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Add any additional validation here
      
      const result = await this.mlService.analyzePatient(patientData);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error analyzing patient:', error);
      res.status(500).json({ error: 'Failed to analyze patient data' });
    }
  };

  public analyzeVoice = async (req: Request, res: Response) => {
    try {
      const audioData = req.body;
      
      if (!audioData) {
        return res.status(400).json({ error: 'Audio data is required' });
      }

      const result = await this.mlService.analyzeVoice(audioData);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error analyzing voice:', error);
      res.status(500).json({ error: 'Failed to analyze voice data' });
    }
  };
}

export default new MLController();
