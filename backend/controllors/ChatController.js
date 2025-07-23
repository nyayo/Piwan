import { StreamChatService } from '../services/StreamChatService.js';
import { sendPushNotificationAsync } from '../services/NotificationService.js';
import { pool } from '../config/db.js';
import crypto from 'crypto';

export const verifyWebhookSignature = (req, res, next) => {
    try {
        const signature = req.headers['x-signature'];
        const secret = process.env.STREAM_API_SECRET;
        
        console.log('Webhook signature verification:');
        console.log('- Received signature:', signature);
        console.log('- Using secret:', secret ? 'Present' : 'Missing');
        
        if (!signature || !secret) {
            console.log('❌ Missing signature or secret');
            return res.status(401).json({ error: 'Missing signature or secret' });
        }
        
        // Get raw body - this should be the Buffer from express.raw()
        let rawBody = req.rawBody;
        
        if (!rawBody) {
            console.log('❌ No raw body found');
            return res.status(400).json({ error: 'No raw body for signature verification' });
        }
        
        // Convert Buffer to string if needed
        if (Buffer.isBuffer(rawBody)) {
            rawBody = rawBody.toString('utf8');
        }
        
        console.log('- Raw body length:', rawBody.length);
        console.log('- Raw body type:', typeof rawBody);
        
        // Generate the expected signature hash (without sha256= prefix)
        const expectedHash = crypto
            .createHmac('sha256', secret)
            .update(rawBody, 'utf8')
            .digest('hex');
        
        // Stream Chat sends signature without 'sha256=' prefix
        const expectedSignature = expectedHash;
        
        console.log('- Expected signature:', expectedSignature);
        console.log('- Signatures match:', signature === expectedSignature);
        
        if (signature !== expectedSignature) {
            console.log('❌ Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        console.log('✅ Signature verification passed');
        next();
    } catch (error) {
        console.error('Signature verification error:', error);
        return res.status(401).json({ error: 'Signature verification failed' });
    }
};


export const generateChatToken = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Ensure user exists in Stream Chat before generating token
        await StreamChatService.createOrUpdateStreamUser(userId, req.user.role);
        
        const token = StreamChatService.generateUserToken(userId);
        res.json({
            success: true,
            token,
            user_id: userId.toString(),
            api_key: process.env.STREAM_API_KEY
        });
    } catch (error) {
        console.error('Error generating chat token:', error);
        res.status(500).json({ success: false, message: 'Failed to generate chat token' });
    }
};

export const createChatRoom = async (req, res) => {
    try {
        const { roomId, name, type, members = [] } = req.body;
        const createdBy = req.user.id;
        
        // Create the room (this will also create the creator in Stream Chat)
        const channel = await StreamChatService.createOrGetRoom(
            roomId,
            { name, type },
            createdBy
        );
        
        console.log('Created Channel: ', channel)
        
        // Add the creator to the room
        await StreamChatService.addUserToRoom(roomId, createdBy, req.user.role, 'owner');
        
        // Add other members to the room
        for (const member of members) {
            await StreamChatService.addUserToRoom(
                roomId,
                member.user_id,
                member.user_type,
                member.role
            );
        }
        
        res.json({ 
            success: true, 
            room_id: roomId,
            message: 'Chat room created successfully'
        });
    } catch (error) {
        console.error('Error in createChatRoom:', error);
        res.status(500).json({ success: false, message: 'Failed to create chat room' });
    }
};

export const getUserRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.role;
        const rooms = await StreamChatService.getUserRooms(userId, userType);
        res.json({ success: true, rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get user rooms' });
    }
};

export const getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50, before } = req.query;
        const messages = await StreamChatService.getRoomMessages(
            roomId,
            parseInt(limit),
            before
        );
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to get room messages' });
    }
};

export const joinRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;
        const userType = req.user.role;
        await StreamChatService.addUserToRoom(roomId, userId, userType);
        res.json({ success: true, message: 'Successfully joined room' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to join room' });
    }
};

export const handleStreamWebhook = async (req, res) => {
    try {
        const { type, ...eventData } = req.body;
        
        // Handle message.new - STORE the message AND send notifications
        if (type === 'message.new') {
            const message = eventData.message;
            const channelId = eventData.channel_id;
            
            // 1. STORE THE MESSAGE FIRST
            try {
                await StreamChatService.storeMessage({
                    id: message.id,
                    room_id: channelId,
                    user_id: parseInt(message.user.id),
                    user_type: message.user.role || 'user',
                    message_type: message.type || 'regular',
                    text: message.text,
                    attachments: message.attachments,
                    mentioned_users: message.mentioned_users,
                    parent_id: message.parent_id,
                    thread_participants: message.thread_participants,
                    reaction_counts: message.reaction_counts,
                    reply_count: message.reply_count,
                    stream_message_id: message.id
                });
                console.log('Message stored successfully:', message.id);
            } catch (storeError) {
                console.error('Error storing message:', storeError);
            }
            
            // 2. Send push notifications to other members
            // Get all members (users and consultants) from chat_members
            const [members] = await pool.query(
                'SELECT user_id, user_type FROM chat_members WHERE room_id = ? AND user_id != ?',
                [channelId, message.user.id]
            );

            for (const member of members) {
                // Determine which table to query based on user_type
                const tableName = member.user_type === 'consultant' ? 'consultants' : 'users';
                const [userRows] = await pool.query(`SELECT push_token FROM ${tableName} WHERE id = ?`, [member.user_id]);
                
                if (userRows.length && userRows[0].push_token) {
                    await sendPushNotificationAsync(
                        userRows[0].push_token,
                        'New Chat Message',
                        `${message.user.name}: ${message.text}`,
                        { roomId: channelId, messageId: message.id }
                    );
                }
            }
        }

        // Handle message.updated
        if (type === 'message.updated') {
            const message = eventData.message;
            await pool.query(
                `UPDATE chat_messages SET text = ?, attachments = ?, reaction_counts = ?, reply_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [
                    message.text,
                    JSON.stringify(message.attachments || []),
                    JSON.stringify(message.reaction_counts || {}),
                    message.reply_count || 0,
                    message.id
                ]
            );
        }

        // Handle message.deleted
        if (type === 'message.deleted') {
            await pool.query(
                `UPDATE chat_messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [eventData.message.id]
            );
        }

        // Handle reaction.new
        if (type === 'reaction.new') {
            await pool.query(
                `INSERT INTO message_reactions (message_id, user_id, user_type, reaction_type)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
                [
                    eventData.message.id,
                    parseInt(eventData.user.id),
                    eventData.user.role || 'user',
                    eventData.reaction.type
                ]
            );
        }

        // Handle reaction.deleted
        if (type === 'reaction.deleted') {
            await pool.query(
                `DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND reaction_type = ?`,
                [
                    eventData.message.id,
                    parseInt(eventData.user.id),
                    eventData.reaction.type
                ]
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
