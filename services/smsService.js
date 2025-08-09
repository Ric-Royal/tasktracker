const twilio = require('twilio');
const moment = require('moment');

class SMSService {
    constructor() {
        this.client = null;
        this.fromNumber = null;
        this.initializeTwilio();
    }

    initializeTwilio() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !this.fromNumber) {
            console.warn('Twilio credentials not configured. SMS notifications will be simulated.');
            return;
        }

        try {
            this.client = twilio(accountSid, authToken);
            console.log('Twilio client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Twilio client:', error.message);
        }
    }

    formatTaskMessage(task) {
        const dueDate = moment(task.due_date);
        const now = moment();
        const isOverdue = dueDate.isBefore(now);
        const timeInfo = isOverdue 
            ? `OVERDUE by ${now.diff(dueDate, 'hours')} hours`
            : `Due in ${dueDate.diff(now, 'hours')} hours`;

        return `🔔 Task Reminder: "${task.title}"

📅 ${timeInfo}
⏰ Due: ${dueDate.format('MMM DD, YYYY h:mm A')}
🎯 Priority: ${task.priority.toUpperCase()}

${task.description ? `📝 ${task.description}` : ''}

Complete your task to stop reminders.`;
    }

    async sendSMS(phoneNumber, message) {
        if (!this.client) {
            // Simulate SMS sending for development
            console.log('📱 SIMULATED SMS:');
            console.log(`To: ${phoneNumber}`);
            console.log(`Message: ${message}`);
            console.log('---');
            return {
                success: true,
                messageId: 'simulated_' + Date.now(),
                simulated: true
            };
        }

        try {
            const result = await this.client.messages.create({
                body: message,
                from: this.fromNumber,
                to: phoneNumber
            });

            console.log(`SMS sent successfully to ${phoneNumber}. SID: ${result.sid}`);
            return {
                success: true,
                messageId: result.sid,
                simulated: false
            };
        } catch (error) {
            console.error(`Failed to send SMS to ${phoneNumber}:`, error.message);
            return {
                success: false,
                error: error.message,
                simulated: false
            };
        }
    }

    async sendTaskReminder(task) {
        const message = this.formatTaskMessage(task);
        return await this.sendSMS(task.phone_number, message);
    }

    // Format phone number for Twilio (must include country code)
    formatPhoneNumber(phoneNumber) {
        // Remove all non-digit characters
        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // If number doesn't start with country code, assume US (+1)
        if (cleaned.length === 10) {
            return '+1' + cleaned;
        }
        
        // If it already has country code but no +, add it
        if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
            return '+' + cleaned;
        }
        
        return phoneNumber;
    }

    validatePhoneNumber(phoneNumber) {
        const formatted = this.formatPhoneNumber(phoneNumber);
        // Basic validation for international phone numbers
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(formatted);
    }
}

module.exports = SMSService;
