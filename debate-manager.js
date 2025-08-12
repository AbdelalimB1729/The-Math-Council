const { sessionOps, participantOps, messageOps } = require('./database');
const { getRandomPersonalities } = require('./ai-personalities');
const aiService = require('./ai-service');

class DebateManager {
  constructor() {
    this.activeSessions = new Map(); // sessionId -> session state
  }

  async createSession(problem, difficulty, memberCount) {
    try {
      // Create session in database
      const sessionResult = sessionOps.create.run(problem, difficulty);
      const sessionId = sessionResult.lastInsertRowid;

      // Get random personalities for the session
      const personalities = getRandomPersonalities(memberCount);
      
      // Create participants in database
      const participants = [];
      for (const personality of personalities) {
        const participantResult = participantOps.create.run(
          sessionId, 
          personality.name, 
          personality.personality, 
          personality.specialty
        );
        participants.push({
          id: participantResult.lastInsertRowid,
          ...personality
        });
      }

      // Initialize session state
      const sessionState = {
        id: sessionId,
        problem,
        difficulty,
        participants,
        currentSpeakerIndex: 0,
        isPaused: false,
        isComplete: false,
        roundCount: 0,
        maxRounds: memberCount * 2, // 2 rounds per participant
        debateHistory: []
      };

      this.activeSessions.set(sessionId, sessionState);

      return {
        sessionId,
        participants,
        sessionState
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    // Check if session is in memory
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId);
    }

    // Load from database if not in memory
    const session = sessionOps.getById.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participants = participantOps.getBySessionId.all(sessionId);
    const messages = messageOps.getBySessionId.all(sessionId);

    const sessionState = {
      id: sessionId,
      problem: session.problem,
      difficulty: session.difficulty,
      participants,
      currentSpeakerIndex: messages.length % participants.length,
      isPaused: false,
      isComplete: messages.length >= participants.length * 2,
      roundCount: messages.length,
      maxRounds: participants.length * 2,
      debateHistory: messages,
      created_at: session.created_at
    };

    this.activeSessions.set(sessionId, sessionState);
    return sessionState;
  }

  async generateNextResponse(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.isComplete || session.isPaused) {
      return null;
    }

    const currentParticipant = session.participants[session.currentSpeakerIndex];
    if (!currentParticipant) {
      return null;
    }

    try {
      // Generate AI response
      const response = await aiService.generateResponse(
        currentParticipant,
        session.problem,
        session.debateHistory,
        session.difficulty
      );

      // Save message to database
      const messageResult = messageOps.create.run(
        sessionId,
        currentParticipant.id,
        response
      );

      const message = {
        id: messageResult.lastInsertRowid,
        session_id: sessionId,
        participant_id: currentParticipant.id,
        content: response,
        name: currentParticipant.name,
        personality: currentParticipant.personality,
        specialty: currentParticipant.specialty,
        created_at: new Date().toISOString()
      };

      // Update session state
      session.debateHistory.push(message);
      session.roundCount++;
      session.currentSpeakerIndex = (session.currentSpeakerIndex + 1) % session.participants.length;

      // Check if debate should end
      if (session.roundCount >= session.maxRounds) {
        session.isComplete = true;
      }

      return message;
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  async pauseSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isPaused = true;
    }
  }

  async resumeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isPaused = false;
    }
  }

  async kickParticipant(sessionId, participantId) {
    try {
      // Deactivate participant in database
      participantOps.deactivate.run(participantId);

      // Update session state
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.participants = session.participants.filter(p => p.id !== participantId);
        
        // Adjust current speaker index if needed
        if (session.currentSpeakerIndex >= session.participants.length) {
          session.currentSpeakerIndex = 0;
        }

        // Recalculate max rounds
        session.maxRounds = session.participants.length * 2;
      }

      return true;
    } catch (error) {
      console.error('Error kicking participant:', error);
      throw error;
    }
  }

  async addParticipant(sessionId, personality) {
    try {
      // Add participant to database
      const participantResult = participantOps.create.run(
        sessionId,
        personality.name,
        personality.personality,
        personality.specialty
      );

      const newParticipant = {
        id: participantResult.lastInsertRowid,
        ...personality
      };

      // Update session state
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.participants.push(newParticipant);
        session.maxRounds = session.participants.length * 2;
      }

      return newParticipant;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  }

  async forceVote(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isComplete = true;
    }
  }

  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      problem: session.problem,
      difficulty: session.difficulty,
      participants: session.participants,
      isPaused: session.isPaused,
      isComplete: session.isComplete,
      roundCount: session.roundCount,
      maxRounds: session.maxRounds,
      currentSpeaker: session.participants[session.currentSpeakerIndex] || null,
      created_at: session.created_at
    };
  }

  getAllSessions() {
    return sessionOps.getAll.all();
  }

  async deleteSession(sessionId) {
    try {
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      
      // Manually delete related records in the correct order
      // First delete messages
      messageOps.deleteBySessionId.run(sessionId);
      
      // Then delete participants
      participantOps.deleteBySessionId.run(sessionId);
      
      // Finally delete the session
      sessionOps.delete.run(sessionId);
      
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }
}

module.exports = new DebateManager();
