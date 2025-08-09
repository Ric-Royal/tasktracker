const cron = require('node-cron');
const DatabaseService = require('./database');
const SMSService = require('./smsService');

class TaskScheduler {
    constructor() {
        this.db = new DatabaseService();
        this.smsService = new SMSService();
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) {
            console.log('Task scheduler is already running');
            return;
        }

        // Check for due tasks every 15 minutes
        this.cronJob = cron.schedule('*/15 * * * *', async () => {
            await this.checkDueTasks();
        }, {
            scheduled: false
        });

        this.cronJob.start();
        this.isRunning = true;
        console.log('Task scheduler started - checking for due tasks every 15 minutes');

        // Run an initial check
        this.checkDueTasks();
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            console.log('Task scheduler stopped');
        }
    }

    async checkDueTasks() {
        try {
            console.log('Checking for due tasks...');
            const dueTasks = await this.db.getTasksDueForReminder();
            
            if (dueTasks.length === 0) {
                console.log('No due tasks found');
                return;
            }

            console.log(`Found ${dueTasks.length} due task(s) that need reminders`);

            for (const task of dueTasks) {
                await this.processTaskReminder(task);
                // Add a small delay between messages to avoid rate limiting
                await this.sleep(1000);
            }
        } catch (error) {
            console.error('Error checking due tasks:', error);
        }
    }

    async processTaskReminder(task) {
        try {
            console.log(`Processing reminder for task: ${task.title} (ID: ${task.id})`);
            
            // Format phone number for Twilio
            const formattedPhone = this.smsService.formatPhoneNumber(task.phone_number);
            
            // Validate phone number
            if (!this.smsService.validatePhoneNumber(formattedPhone)) {
                console.error(`Invalid phone number for task ${task.id}: ${task.phone_number}`);
                await this.logNotification(task.id, task.phone_number, 'Invalid phone number', 'failed', 'Invalid phone number format');
                return;
            }

            // Send SMS reminder
            const result = await this.smsService.sendTaskReminder({
                ...task,
                phone_number: formattedPhone
            });

            if (result.success) {
                // Mark reminder as sent
                await this.db.markReminderSent(task.id);
                
                // Log successful notification
                await this.logNotification(
                    task.id, 
                    formattedPhone, 
                    this.smsService.formatTaskMessage(task), 
                    'sent',
                    null,
                    result.messageId,
                    result.simulated
                );
                
                console.log(`✅ Reminder sent for task: ${task.title}`);
            } else {
                // Log failed notification
                await this.logNotification(
                    task.id, 
                    formattedPhone, 
                    this.smsService.formatTaskMessage(task), 
                    'failed', 
                    result.error
                );
                
                console.error(`❌ Failed to send reminder for task: ${task.title} - ${result.error}`);
            }
        } catch (error) {
            console.error(`Error processing reminder for task ${task.id}:`, error);
            await this.logNotification(
                task.id, 
                task.phone_number, 
                'System error occurred', 
                'failed', 
                error.message
            );
        }
    }

    async logNotification(taskId, phoneNumber, message, status, errorMessage = null, messageId = null, simulated = false) {
        try {
            await this.db.logNotification({
                task_id: taskId,
                phone_number: phoneNumber,
                message: message,
                status: status,
                error_message: errorMessage
            });
            
            if (simulated) {
                console.log(`📝 Logged simulated notification for task ${taskId}`);
            }
        } catch (error) {
            console.error('Error logging notification:', error);
        }
    }

    async manualCheck() {
        console.log('Running manual check for due tasks...');
        await this.checkDueTasks();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.cronJob ? this.cronJob.nextDate() : null
        };
    }
}

module.exports = TaskScheduler;
