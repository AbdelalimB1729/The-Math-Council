const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

// Import modules
const debateManager = require('./debate-manager');
const { personalities } = require('./ai-personalities');
const pdfGenerator = require('./pdf-generator');
const { messageOps } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS Layouts setup
app.use(expressLayouts);
app.set('layout', 'layout');

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-session', (sessionId) => {
        socket.join(`session-${sessionId}`);
        console.log(`User ${socket.id} joined session ${sessionId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes

// Homepage
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Create new session
app.post('/create-session', async (req, res) => {
    try {
        const { problem, difficulty, memberCount } = req.body;
        
        if (!problem || !difficulty || !memberCount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const memberCountNum = parseInt(memberCount);
        if (memberCountNum < 3 || memberCountNum > 7) {
            return res.status(400).json({ error: 'Member count must be between 3 and 7' });
        }
        
        const result = await debateManager.createSession(problem, difficulty, memberCountNum);
        
        res.redirect(`/debate/${result.sessionId}`);
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Debate page
app.get('/debate/:id', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = await debateManager.getSession(sessionId);
        
        res.render('debate', { 
            title: 'Debate Session',
            sessionId: sessionId,
            session: session
        });
    } catch (error) {
        console.error('Error loading debate:', error);
        res.status(404).render('error', { 
            title: 'Error',
            message: 'Debate session not found' 
        });
    }
});

// Sessions list
app.get('/sessions', (req, res) => {
    try {
        const sessions = debateManager.getAllSessions();
        res.render('sessions', { 
            title: 'Past Debates',
            sessions: sessions 
        });
    } catch (error) {
        console.error('Error loading sessions:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to load sessions' 
        });
    }
});

// API Routes

// Get session data
app.get('/api/session/:id', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = await debateManager.getSession(sessionId);
        
        // Ensure we include messages in the response
        const messages = messageOps.getBySessionId.all(sessionId);
        session.messages = messages;
        
        res.json(session);
    } catch (error) {
        console.error('Error getting session:', error);
        res.status(404).json({ error: 'Session not found' });
    }
});

// Generate next response
app.post('/api/session/:id/generate-response', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const session = await debateManager.getSession(sessionId);
        
        if (session.isComplete || session.isPaused) {
            return res.json({ success: false, error: 'Debate is not active' });
        }
        
        // Show typing indicator
        const currentSpeaker = session.participants[session.currentSpeakerIndex];
        io.to(`session-${sessionId}`).emit('typing', currentSpeaker.name);
        
        // Generate response
        const message = await debateManager.generateNextResponse(sessionId);
        
        if (message) {
            // Broadcast new message
            io.to(`session-${sessionId}`).emit('new-message', message);
            
            // Check if debate is complete
            if (session.isComplete) {
                io.to(`session-${sessionId}`).emit('debate-complete');
            }
            
            res.json({ success: true, message });
        } else {
            res.json({ success: false, error: 'No response generated' });
        }
    } catch (error) {
        console.error('Error generating response:', error);
        res.status(500).json({ success: false, error: 'Failed to generate response' });
    }
});

// Pause session
app.post('/api/session/:id/pause', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        await debateManager.pauseSession(sessionId);
        
        // Broadcast session update
        const session = await debateManager.getSession(sessionId);
        io.to(`session-${sessionId}`).emit('session-updated', session);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error pausing session:', error);
        res.status(500).json({ success: false, error: 'Failed to pause session' });
    }
});

// Resume session
app.post('/api/session/:id/resume', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        await debateManager.resumeSession(sessionId);
        
        // Broadcast session update
        const session = await debateManager.getSession(sessionId);
        io.to(`session-${sessionId}`).emit('session-updated', session);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error resuming session:', error);
        res.status(500).json({ success: false, error: 'Failed to resume session' });
    }
});

// Force vote
app.post('/api/session/:id/force-vote', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        await debateManager.forceVote(sessionId);
        
        // Broadcast debate completion
        io.to(`session-${sessionId}`).emit('debate-complete');
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error forcing vote:', error);
        res.status(500).json({ success: false, error: 'Failed to force vote' });
    }
});

// Kick participant
app.post('/api/session/:id/kick-participant/:participantId', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const participantId = parseInt(req.params.participantId);
        
        await debateManager.kickParticipant(sessionId, participantId);
        
        // Broadcast session update
        const session = await debateManager.getSession(sessionId);
        io.to(`session-${sessionId}`).emit('session-updated', session);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error kicking participant:', error);
        res.status(500).json({ success: false, error: 'Failed to kick participant' });
    }
});

// Add participant
app.post('/api/session/:id/add-participant', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { personality } = req.body;
        
        if (!personality) {
            return res.status(400).json({ success: false, error: 'Personality is required' });
        }
        
        const personalityData = personalities.find(p => p.name === personality);
        if (!personalityData) {
            return res.status(400).json({ success: false, error: 'Invalid personality' });
        }
        
        const newParticipant = await debateManager.addParticipant(sessionId, personalityData);
        
        // Broadcast session update
        const session = await debateManager.getSession(sessionId);
        io.to(`session-${sessionId}`).emit('session-updated', session);
        
        res.json({ success: true, participant: newParticipant });
    } catch (error) {
        console.error('Error adding participant:', error);
        res.status(500).json({ success: false, error: 'Failed to add participant' });
    }
});

// Delete session
app.delete('/api/session/:id', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        await debateManager.deleteSession(sessionId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ success: false, error: 'Failed to delete session' });
    }
});

// Export PDF
app.get('/debate/:id/export', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.id);
        
        // Generate PDF
        const doc = await pdfGenerator.generateDebatePDF(sessionId);
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="math-council-debate-${sessionId}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { 
        title: 'Error',
        message: 'Something went wrong!' 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Page not found' 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 The Math Council server running on port ${PORT}`);
    console.log(`📊 OpenRouter API: ${process.env.OPENROUTER_API_KEY ? 'Configured' : 'Not configured (using simulated responses)'}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
