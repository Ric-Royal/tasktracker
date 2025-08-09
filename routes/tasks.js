const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/database');
const moment = require('moment');

const db = new DatabaseService();

// Validation middleware
const validateTask = (req, res, next) => {
    const { title, due_date, phone_number } = req.body;
    
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!due_date) {
        return res.status(400).json({ error: 'Due date is required' });
    }
    
    if (!moment(due_date).isValid()) {
        return res.status(400).json({ error: 'Invalid due date format' });
    }
    
    if (!phone_number || !phone_number.trim()) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Basic phone number validation (accepts various formats)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    next();
};

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await db.getAllTasks();
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req, res) => {
    try {
        const task = await db.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// POST /api/tasks - Create a new task
router.post('/', validateTask, async (req, res) => {
    try {
        const { title, description, due_date, priority, phone_number } = req.body;
        
        // Clean phone number
        const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
        
        const task = await db.createTask({
            title: title.trim(),
            description: description ? description.trim() : null,
            due_date: moment(due_date).format('YYYY-MM-DD HH:mm:ss'),
            priority: priority || 'medium',
            phone_number: cleanPhone
        });
        
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
    try {
        const { title, description, due_date, priority, status, phone_number } = req.body;
        const updates = {};
        
        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ error: 'Title cannot be empty' });
            }
            updates.title = title.trim();
        }
        
        if (description !== undefined) {
            updates.description = description ? description.trim() : null;
        }
        
        if (due_date !== undefined) {
            if (!moment(due_date).isValid()) {
                return res.status(400).json({ error: 'Invalid due date format' });
            }
            updates.due_date = moment(due_date).format('YYYY-MM-DD HH:mm:ss');
            // Reset reminder flag if due date is changed
            updates.reminder_sent = false;
        }
        
        if (priority !== undefined) {
            if (!['low', 'medium', 'high'].includes(priority)) {
                return res.status(400).json({ error: 'Priority must be low, medium, or high' });
            }
            updates.priority = priority;
        }
        
        if (status !== undefined) {
            if (!['pending', 'in_progress', 'completed'].includes(status)) {
                return res.status(400).json({ error: 'Status must be pending, in_progress, or completed' });
            }
            updates.status = status;
        }
        
        if (phone_number !== undefined) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = phone_number.replace(/[\s\-\(\)]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
            updates.phone_number = cleanPhone;
        }
        
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        const result = await db.updateTask(req.params.id, updates);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const updatedTask = await db.getTaskById(req.params.id);
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.deleteTask(req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;
