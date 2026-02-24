import { EventEmitter } from 'events';
import logger from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  frequency?: string;
  description?: string;
}

interface PatientContext {
  age?: number;
  gender?: string;
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  recentTravel?: string[];
  exposures?: string[];
}

interface SymptomAssessment {
  id: string;
  userId: string;
  symptoms: Symptom[];
  aiAssessment: {
    possibleConditions: Array<{
      condition: string;
      probability: number;
      severity: string;
      description: string;
    }>;
    urgencyLevel: 'emergency' | 'urgent' | 'routine' | 'informational';
    recommendedAction: string;
    redFlags: string[];
    selfCareAdvice?: string[];
    monitoringGuidelines?: string[];
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  consultationId?: string;
}

/**
 * AI-Assisted Symptom Checker Service
 * Provides conversational symptom assessment with triage recommendations
 */
export class AISymptomCheckerService extends EventEmitter {
  private db: any;
  private aiModelService: any;

  // Medical knowledge base (in production, this would be much more comprehensive)
  private readonly CONDITIONS_DATABASE = {
    // Emergency conditions
    'stroke': {
      keywords: ['facial drooping', 'arm weakness', 'speech difficulty', 'sudden numbness', 'vision loss', 'severe headache'],
      severity: 'critical',
      urgency: 'emergency',
      action: 'Call emergency services immediately (911/999). Time is critical for stroke treatment.'
    },
    'heart_attack': {
      keywords: ['chest pain', 'chest pressure', 'left arm pain', 'jaw pain', 'shortness of breath', 'nausea', 'cold sweat'],
      severity: 'critical',
      urgency: 'emergency',
      action: 'Call emergency services immediately. Chew aspirin if available and not allergic.'
    },
    'anaphylaxis': {
      keywords: ['severe allergic reaction', 'difficulty breathing', 'swelling throat', 'rapid pulse', 'dizziness', 'hives all over'],
      severity: 'critical',
      urgency: 'emergency',
      action: 'Use EpiPen if available and call emergency services immediately.'
    },

    // Urgent conditions
    'appendicitis': {
      keywords: ['abdominal pain', 'right lower quadrant pain', 'nausea', 'vomiting', 'fever', 'loss of appetite'],
      severity: 'high',
      urgency: 'urgent',
      action: 'Seek emergency room evaluation within 2-4 hours. Do not eat or drink.'
    },
    'pneumonia': {
      keywords: ['cough', 'fever', 'chest pain', 'difficulty breathing', 'fatigue', 'confusion in elderly'],
      severity: 'moderate-high',
      urgency: 'urgent',
      action: 'See a healthcare provider within 24 hours. May require antibiotics and monitoring.'
    },

    // Routine conditions
    'common_cold': {
      keywords: ['runny nose', 'sore throat', 'cough', 'sneezing', 'mild fever', 'congestion'],
      severity: 'low',
      urgency: 'routine',
      action: 'Rest, stay hydrated, and use over-the-counter remedies. See doctor if symptoms worsen or persist beyond 10 days.'
    },
    'migraine': {
      keywords: ['severe headache', 'nausea', 'light sensitivity', 'sound sensitivity', 'visual aura'],
      severity: 'moderate',
      urgency: 'routine',
      action: 'Rest in dark, quiet room. Use prescribed medications. Consult doctor if new or worsening pattern.'
    },

    // Mental health conditions
    'depression': {
      keywords: ['persistent sadness', 'loss of interest', 'sleep changes', 'appetite changes', 'fatigue', 'worthlessness'],
      severity: 'moderate',
      urgency: 'routine',
      action: 'Schedule appointment with mental health professional. If suicidal thoughts, seek immediate help.'
    },
    'anxiety': {
      keywords: ['excessive worry', 'restlessness', 'rapid heartbeat', 'sweating', 'trembling', 'panic attacks'],
      severity: 'moderate',
      urgency: 'routine',
      action: 'Consider mental health evaluation. Practice breathing exercises. If severe, seek same-day care.'
    },

    // Epidemic-related conditions
    'covid19': {
      keywords: ['fever', 'dry cough', 'loss of taste', 'loss of smell', 'fatigue', 'body aches', 'shortness of breath'],
      severity: 'variable',
      urgency: 'urgent',
      action: 'Self-isolate, get tested, and monitor symptoms. Seek emergency care if severe breathing difficulty.'
    },
    'hiv_acute': {
      keywords: ['fever', 'rash', 'sore throat', 'swollen lymph nodes', 'muscle aches', 'recent exposure'],
      severity: 'high',
      urgency: 'urgent',
      action: 'Seek immediate HIV testing and PEP (Post-Exposure Prophylaxis) if exposure within 72 hours.'
    }
  };

  constructor(database: any, aiModelService: any) {
    super();
    this.db = database;
    this.aiModelService = aiModelService;
  }

  /**
   * Start a new symptom assessment conversation
   */
  async startAssessment(userId: string, initialSymptoms: string, context?: PatientContext): Promise<SymptomAssessment> {
    const assessmentId = uuidv4();

    const assessment: SymptomAssessment = {
      id: assessmentId,
      userId,
      symptoms: [],
      aiAssessment: {
        possibleConditions: [],
        urgencyLevel: 'routine',
        recommendedAction: '',
        redFlags: [],
        selfCareAdvice: [],
        monitoringGuidelines: []
      },
      conversationHistory: [
        {
          role: 'user',
          message: initialSymptoms,
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    };

    // Initial AI response to gather more information
    const response = await this.generateAIResponse(initialSymptoms, context);

    assessment.conversationHistory.push({
      role: 'assistant',
      message: response.message,
      timestamp: new Date()
    });

    // Parse initial symptoms
    assessment.symptoms = this.parseSymptoms(initialSymptoms);

    // Save to database
    await this.saveAssessment(assessment);

    logger.info(`Started symptom assessment ${assessmentId} for user ${userId}`);

    this.emit('assessmentStarted', { assessmentId, userId });

    return assessment;
  }

  /**
   * Continue an ongoing assessment conversation
   */
  async continueAssessment(
    assessmentId: string,
    userMessage: string,
    context?: PatientContext
  ): Promise<SymptomAssessment> {
    const assessment = await this.getAssessment(assessmentId);

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Add user message to conversation
    assessment.conversationHistory.push({
      role: 'user',
      message: userMessage,
      timestamp: new Date()
    });

    // Extract additional symptoms from the message
    const newSymptoms = this.parseSymptoms(userMessage);
    assessment.symptoms = [...assessment.symptoms, ...newSymptoms];

    // Generate AI response
    const conversationContext = assessment.conversationHistory.map(msg =>
      `${msg.role}: ${msg.message}`
    ).join('\n');

    const response = await this.generateAIResponse(conversationContext, context);

    assessment.conversationHistory.push({
      role: 'assistant',
      message: response.message,
      timestamp: new Date()
    });

    // Check if we have enough information for assessment
    if (response.readyForAssessment) {
      assessment.aiAssessment = await this.performAssessment(assessment.symptoms, context);
    }

    // Update in database
    await this.updateAssessment(assessment);

    return assessment;
  }

  /**
   * Perform final AI-powered symptom assessment
   */
  private async performAssessment(
    symptoms: Symptom[],
    context?: PatientContext
  ): Promise<SymptomAssessment['aiAssessment']> {
    const possibleConditions: any[] = [];
    const redFlags: string[] = [];
    let highestUrgency: 'emergency' | 'urgent' | 'routine' | 'informational' = 'informational';

    // Analyze symptoms against knowledge base
    for (const [conditionName, condition] of Object.entries(this.CONDITIONS_DATABASE)) {
      let matchScore = 0;

      for (const symptom of symptoms) {
        const symptomText = symptom.name.toLowerCase();

        for (const keyword of condition.keywords) {
          if (symptomText.includes(keyword) || keyword.includes(symptomText)) {
            matchScore++;

            // Check for red flags
            if (condition.urgency === 'emergency') {
              redFlags.push(`${keyword} can indicate ${conditionName} - seek immediate medical attention`);
            }
          }
        }
      }

      if (matchScore > 0) {
        const probability = Math.min((matchScore / condition.keywords.length) * 100, 95);

        possibleConditions.push({
          condition: conditionName.replace(/_/g, ' ').toUpperCase(),
          probability: Math.round(probability),
          severity: condition.severity,
          description: this.getConditionDescription(conditionName)
        });

        // Update urgency level
        if (condition.urgency === 'emergency' && highestUrgency !== 'emergency') {
          highestUrgency = 'emergency';
        } else if (condition.urgency === 'urgent' && highestUrgency !== 'emergency' && highestUrgency !== 'urgent') {
          highestUrgency = 'urgent';
        } else if (condition.urgency === 'routine' && highestUrgency === 'informational') {
          highestUrgency = 'routine';
        }
      }
    }

    // Sort by probability
    possibleConditions.sort((a, b) => b.probability - a.probability);

    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(highestUrgency, possibleConditions);

    // Generate self-care advice
    const selfCareAdvice = this.generateSelfCareAdvice(symptoms, highestUrgency);

    // Generate monitoring guidelines
    const monitoringGuidelines = this.generateMonitoringGuidelines(symptoms, possibleConditions);

    return {
      possibleConditions: possibleConditions.slice(0, 5), // Top 5 matches
      urgencyLevel: highestUrgency,
      recommendedAction,
      redFlags: redFlags.slice(0, 3), // Top 3 red flags
      selfCareAdvice,
      monitoringGuidelines
    };
  }

  /**
   * Generate AI response for conversation
   */
  private async generateAIResponse(
    conversationContext: string,
    context?: PatientContext
  ): Promise<{ message: string; readyForAssessment: boolean }> {
    // In production, this would call an actual AI model (GPT-4, Claude, etc.)
    // For now, we'll use rule-based logic

    const hasEnoughInfo = conversationContext.split('\n').length > 6;

    if (!hasEnoughInfo) {
      // Ask follow-up questions
      const questions = [
        "Could you describe when these symptoms started?",
        "How severe would you rate your symptoms on a scale of 1-10?",
        "Have you experienced any fever, and if so, how high?",
        "Are you currently taking any medications?",
        "Do you have any chronic health conditions?",
        "Have you traveled recently or been exposed to anyone who is sick?"
      ];

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      return {
        message: `I understand. ${randomQuestion}`,
        readyForAssessment: false
      };
    }

    return {
      message: "Thank you for providing that information. I have enough details to provide you with an assessment. Let me analyze your symptoms...",
      readyForAssessment: true
    };
  }

  /**
   * Parse symptoms from natural language text
   */
  private parseSymptoms(text: string): Symptom[] {
    const symptoms: Symptom[] = [];
    const lowerText = text.toLowerCase();

    // Common symptom keywords
    const symptomPatterns = [
      { name: 'fever', severity: 'moderate' },
      { name: 'cough', severity: 'mild' },
      { name: 'headache', severity: 'mild' },
      { name: 'chest pain', severity: 'severe' },
      { name: 'shortness of breath', severity: 'severe' },
      { name: 'nausea', severity: 'mild' },
      { name: 'vomiting', severity: 'moderate' },
      { name: 'diarrhea', severity: 'mild' },
      { name: 'fatigue', severity: 'mild' },
      { name: 'body aches', severity: 'mild' },
      { name: 'sore throat', severity: 'mild' },
      { name: 'runny nose', severity: 'mild' },
      { name: 'congestion', severity: 'mild' },
      { name: 'dizziness', severity: 'moderate' },
      { name: 'abdominal pain', severity: 'moderate' },
      { name: 'rash', severity: 'mild' }
    ];

    for (const pattern of symptomPatterns) {
      if (lowerText.includes(pattern.name)) {
        symptoms.push({
          name: pattern.name,
          severity: pattern.severity as any,
          duration: 'Unknown',
          description: text
        });
      }
    }

    return symptoms;
  }

  /**
   * Generate recommended action based on urgency
   */
  private generateRecommendedAction(
    urgency: 'emergency' | 'urgent' | 'routine' | 'informational',
    conditions: any[]
  ): string {
    switch (urgency) {
      case 'emergency':
        return 'SEEK EMERGENCY MEDICAL ATTENTION IMMEDIATELY. Call 911/999 or go to the nearest emergency room. Do not wait.';

      case 'urgent':
        return 'See a healthcare provider within 24 hours. If symptoms worsen, seek emergency care. Consider virtual consultation for faster access.';

      case 'routine':
        return 'Schedule an appointment with your primary care provider within 1-2 weeks. Monitor your symptoms and seek earlier care if they worsen.';

      default:
        return 'Continue monitoring your symptoms. Practice self-care and consult a healthcare provider if symptoms persist or worsen.';
    }
  }

  /**
   * Generate self-care advice
   */
  private generateSelfCareAdvice(symptoms: Symptom[], urgency: string): string[] {
    if (urgency === 'emergency') {
      return ['Focus on getting immediate medical attention'];
    }

    const advice: string[] = [
      'Stay well hydrated by drinking plenty of water',
      'Get adequate rest and sleep',
      'Eat nutritious, easy-to-digest foods'
    ];

    // Add symptom-specific advice
    const symptomNames = symptoms.map(s => s.name.toLowerCase());

    if (symptomNames.some(s => s.includes('fever'))) {
      advice.push('Take acetaminophen or ibuprofen for fever (if not contraindicated)');
      advice.push('Use cool compresses to reduce fever');
    }

    if (symptomNames.some(s => s.includes('cough'))) {
      advice.push('Use honey or over-the-counter cough remedies');
      advice.push('Stay in a humid environment or use a humidifier');
    }

    if (symptomNames.some(s => s.includes('congestion') || s.includes('runny nose'))) {
      advice.push('Use saline nasal spray or rinse');
      advice.push('Try steam inhalation');
    }

    return advice;
  }

  /**
   * Generate monitoring guidelines
   */
  private generateMonitoringGuidelines(symptoms: Symptom[], conditions: any[]): string[] {
    const guidelines: string[] = [
      'Monitor your temperature twice daily',
      'Keep track of symptom severity and any changes',
      'Note any new symptoms that develop'
    ];

    // Add condition-specific monitoring
    if (conditions.some(c => c.condition.includes('RESPIRATORY'))) {
      guidelines.push('Monitor breathing rate and oxygen saturation if possible');
      guidelines.push('Watch for increasing shortness of breath');
    }

    if (conditions.some(c => c.condition.includes('CARDIAC') || c.condition.includes('HEART'))) {
      guidelines.push('Monitor heart rate and blood pressure if possible');
      guidelines.push('Watch for chest pain or pressure');
    }

    guidelines.push('Seek immediate care if symptoms suddenly worsen or new concerning symptoms appear');

    return guidelines;
  }

  /**
   * Get condition description
   */
  private getConditionDescription(conditionName: string): string {
    const descriptions: Record<string, string> = {
      stroke: 'A stroke occurs when blood flow to part of the brain is interrupted, causing brain cells to die.',
      heart_attack: 'A heart attack happens when blood flow to the heart is blocked, usually by a blood clot.',
      common_cold: 'A viral infection of the upper respiratory tract, usually mild and self-limiting.',
      pneumonia: 'An infection that inflames air sacs in one or both lungs, which may fill with fluid.',
      covid19: 'A respiratory illness caused by the SARS-CoV-2 virus.',
      // Add more descriptions...
    };

    return descriptions[conditionName] || 'Please consult a healthcare provider for more information about this condition.';
  }

  /**
   * Database operations
   */
  private async saveAssessment(assessment: SymptomAssessment): Promise<void> {
    try {
      await this.db('symptom_assessments').insert({
        id: assessment.id,
        user_id: assessment.userId,
        symptoms: JSON.stringify(assessment.symptoms),
        ai_assessment: JSON.stringify(assessment.aiAssessment),
        urgency_level: assessment.aiAssessment.urgencyLevel,
        recommended_action: assessment.aiAssessment.recommendedAction,
        conversation_history: JSON.stringify(assessment.conversationHistory),
        assessed_at: new Date(),
        created_at: assessment.createdAt
      });
    } catch (error) {
      logger.error('Error saving assessment:', error);
      throw error;
    }
  }

  private async updateAssessment(assessment: SymptomAssessment): Promise<void> {
    try {
      await this.db('symptom_assessments')
        .where({ id: assessment.id })
        .update({
          symptoms: JSON.stringify(assessment.symptoms),
          ai_assessment: JSON.stringify(assessment.aiAssessment),
          urgency_level: assessment.aiAssessment.urgencyLevel,
          recommended_action: assessment.aiAssessment.recommendedAction,
          conversation_history: JSON.stringify(assessment.conversationHistory),
          updated_at: new Date()
        });
    } catch (error) {
      logger.error('Error updating assessment:', error);
      throw error;
    }
  }

  private async getAssessment(assessmentId: string): Promise<SymptomAssessment | null> {
    try {
      const row = await this.db('symptom_assessments')
        .where({ id: assessmentId })
        .first();

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        userId: row.user_id,
        symptoms: JSON.parse(row.symptoms),
        aiAssessment: JSON.parse(row.ai_assessment),
        conversationHistory: JSON.parse(row.conversation_history),
        createdAt: row.created_at,
        consultationId: row.consultation_id
      };
    } catch (error) {
      logger.error('Error getting assessment:', error);
      throw error;
    }
  }

  /**
   * Get user's assessment history
   */
  async getUserAssessments(userId: string, limit: number = 10): Promise<SymptomAssessment[]> {
    try {
      const rows = await this.db('symptom_assessments')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc')
        .limit(limit);

      return rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        symptoms: JSON.parse(row.symptoms),
        aiAssessment: JSON.parse(row.ai_assessment),
        conversationHistory: JSON.parse(row.conversation_history),
        createdAt: row.created_at,
        consultationId: row.consultation_id
      }));
    } catch (error) {
      logger.error('Error getting user assessments:', error);
      throw error;
    }
  }

  /**
   * Link assessment to a consultation
   */
  async linkToConsultation(assessmentId: string, consultationId: string): Promise<void> {
    try {
      await this.db('symptom_assessments')
        .where({ id: assessmentId })
        .update({ consultation_id: consultationId });

      this.emit('assessmentLinkedToConsultation', { assessmentId, consultationId });
    } catch (error) {
      logger.error('Error linking assessment to consultation:', error);
      throw error;
    }
  }
}

export default AISymptomCheckerService;
