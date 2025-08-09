require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const TaskScheduler = require('./services/taskScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize task scheduler
const taskScheduler = new TaskScheduler();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/tasks', require('./routes/tasks'));

// Scheduler management routes
app.get('/api/scheduler/status', (req, res) => {
    res.json(taskScheduler.getStatus());
});

app.post('/api/scheduler/check', async (req, res) => {
    try {
        await taskScheduler.manualCheck();
        res.json({ message: 'Manual check completed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to run manual check' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        scheduler: taskScheduler.getStatus()
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    taskScheduler.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    taskScheduler.stop();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`Task Tracker server running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
    
    // Start the task scheduler
    taskScheduler.start();
    
    // Log environment info
    console.log('Environment:', process.env.NODE_ENV || 'development');
    if (!process.env.TWILIO_ACCOUNT_SID) {
        console.log('⚠️  Twilio not configured - SMS notifications will be simulated');
        console.log('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to enable real SMS');
    }
});
