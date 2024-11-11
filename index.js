// const express = require('express');
// const { Server } = require('socket.io');
// const http = require('http');
// const prisma = require('@prisma/client').PrismaClient;

// // Initialize Express app and HTTP server
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server);

// // Prisma client initialization
// const prismaClient = new prisma();

// // Middleware to parse JSON requests
// app.use(express.json());

// // In-memory message ID counter
// let messageId = 1;

// // Helper function to fetch user data from Prisma
// async function getUser(userId) {
//     let user = await prismaClient.user.findUnique({
//         where: { id: userId }
//     });
//     if (!user) {
//         user = await prismaClient.user.create({
//             data: { name: `User${userId}` }
//         });
//     }
//     return user;
// }

// // Helper function to fetch conversations between two users
// async function getConversation(userId1, userId2) {
//     // Get the conversation messages between two users from Prisma
//     const messages = await prismaClient.message.findMany({
//         where: {
//             OR: [
//                 { senderId: userId1, receiverId: userId2 },
//                 { senderId: userId2, receiverId: userId1 }
//             ]
//         },
//         orderBy: { timestamp: 'asc' }
//     });

//     const unreadCount = messages.filter(
//         msg => msg.receiverId === userId1 && msg.status === 'unread'
//     ).length;

//     return { messages, unreadCount };
// }

// // API to get conversations for a user
// // API to get conversations for a user
// app.get('/conversations/:userId', async (req, res) => {
//     const userId = parseInt(req.params.userId);

//     // Fetch the user's details to ensure user exists
//     const user = await getUser(userId);

//     // Get all messages where the user is either the sender or the receiver
//     const conversations = await prismaClient.message.findMany({
//         where: {
//             OR: [
//                 { senderId: user.id },
//                 { receiverId: user.id }
//             ]
//         },
//         orderBy: { timestamp: 'desc' }
//     });

//     // Create a map to group messages by their conversation (senderId and receiverId)
//     const groupedConversations = {};

//     conversations.forEach(message => {
//         const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
//         if (!groupedConversations[otherUserId]) {
//             groupedConversations[otherUserId] = {
//                 unreadMessagesCount: 0,
//                 lastMessage: message.message,
//                 messages: []
//             };
//         }

//         // Add the current message to the grouped conversation
//         groupedConversations[otherUserId].messages.push(message);

//         // Count unread messages (messages where the user is the receiver and the status is unread)
//         if (message.receiverId === userId && message.status === 'unread') {
//             groupedConversations[otherUserId].unreadMessagesCount += 1;
//         }

//         // Update last message in the conversation (always set to the latest message)
//         groupedConversations[otherUserId].lastMessage = message.message;
//     });

//     // Format the result into the required structure
//     const formattedConversations = Object.keys(groupedConversations).map(otherUserId => {
//         return {
//             userId: parseInt(otherUserId),
//             unreadMessagesCount: groupedConversations[otherUserId].unreadMessagesCount,
//             lastMessage: groupedConversations[otherUserId].lastMessage
//         };
//     });

//     // Return the formatted conversations
//     res.json(formattedConversations);
// });

// // API to send a message
// app.post('/messages', async (req, res) => {
//     const { senderId, receiverId, message } = req.body;

//     // Ensure both sender and receiver are valid users
//     const sender = await getUser(senderId);
//     const receiver = await getUser(receiverId);

//     // Create new message in the database
//     const newMessage = await prismaClient.message.create({
//         data: {
//             senderId,
//             receiverId,
//             message,
//             status: 'unread',
//             timestamp: new Date().toISOString()
//         }
//     });

//     res.status(201).json({
//         status: 'success',
//         messageId: newMessage.id
//     });

//     // Notify receiver about the new message in real-time via WebSockets
//     io.to(receiver.id).emit('new_message', newMessage);
// });

// // API to get all messages in a conversation
// app.get('/conversations/:userId/:otherUserId/messages', async (req, res) => {
//     const userId = parseInt(req.params.userId);
//     const otherUserId = parseInt(req.params.otherUserId);

//     // Get the conversation between the two users
//     const { messages, unreadCount } = await getConversation(userId, otherUserId);

//     // Mark all unread messages as read for the user requesting the messages
//     await prismaClient.message.updateMany({
//         where: {
//             receiverId: userId,
//             senderId: otherUserId,
//             status: 'unread'
//         },
//         data: { status: 'read' }
//     });

//     // Return the conversation messages
//     res.json(messages);
// });

// // API to mark a specific message as read
// app.post('/messages/:messageId/read', async (req, res) => {
//     const { messageId } = req.params;

//     // Update the message status to 'read'
//     const updatedMessage = await prismaClient.message.update({
//         where: { id: parseInt(messageId) },
//         data: { status: 'read' }
//     });

//     // Return success response
//     res.status(200).json({ status: 'success' });
// });

// // WebSocket connection for real-time messaging
// io.on('connection', (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // Register the user to a socket
//     socket.on('register', async (userId) => {
//         console.log(`User ${userId} registered to WebSocket`);
//         socket.join(userId.toString());  // Join a room based on user ID
//     });

//     // Handle message sending
//     socket.on('send_message', async ({ senderId, receiverId, message }) => {
//         // Save message to database
//         const newMessage = await prismaClient.message.create({
//             data: {
//                 senderId,
//                 receiverId,
//                 message,
//                 status: 'unread',
//                 timestamp: new Date().toISOString()
//             }
//         });

//         // Emit message to receiver
//         io.to(receiverId.toString()).emit('new_message', newMessage);
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected');
//     });
// });

// // Start the server on port 3000
// const PORT = 3000;
// server.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const { PrismaClient } = require('@prisma/client'); // Direct import

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Prisma client initialization
const prisma = new PrismaClient(); // Correct Prisma client initialization

// Middleware to parse JSON requests
app.use(express.json());

// Helper function to fetch user data from Prisma
async function getUser(userId) {
    let user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        // Creating user if not exists
        user = await prisma.user.create({
            data: { name: `User${userId}` }
        });
    }
    return user;
}

// Helper function to fetch conversations between two users
async function getConversation(userId1, userId2) {
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        },
        orderBy: { timestamp: 'asc' }
    });

    const unreadCount = messages.filter(
        msg => msg.receiverId === userId1 && msg.status === 'unread'
    ).length;

    return { messages, unreadCount };
}

// API to get conversations for a user
app.get('/conversations/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Fetch the user's details to ensure user exists
    const user = await getUser(userId);

    // Get all messages where the user is either the sender or the receiver
    const conversations = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: user.id },
                { receiverId: user.id }
            ]
        },
        orderBy: { timestamp: 'desc' }
    });

    const groupedConversations = {};

    conversations.forEach(message => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        if (!groupedConversations[otherUserId]) {
            groupedConversations[otherUserId] = {
                unreadMessagesCount: 0,
                lastMessage: message.message,
                messages: []
            };
        }

        groupedConversations[otherUserId].messages.push(message);

        if (message.receiverId === userId && message.status === 'unread') {
            groupedConversations[otherUserId].unreadMessagesCount += 1;
        }

        groupedConversations[otherUserId].lastMessage = message.message;
    });

    const formattedConversations = Object.keys(groupedConversations).map(otherUserId => {
        return {
            userId: parseInt(otherUserId),
            unreadMessagesCount: groupedConversations[otherUserId].unreadMessagesCount,
            lastMessage: groupedConversations[otherUserId].lastMessage
        };
    });

    res.json(formattedConversations);
});

// API to send a message
app.post('/messages', async (req, res) => {
    const { senderId, receiverId, message } = req.body;

    const sender = await getUser(senderId);
    const receiver = await getUser(receiverId);

    const newMessage = await prisma.message.create({
        data: {
            senderId,
            receiverId,
            message,
            status: 'unread',
            timestamp: new Date().toISOString()
        }
    });

    res.status(201).json({
        status: 'success',
        messageId: newMessage.id
    });

    // Emit message to receiver in real-time using WebSockets
    io.to(receiver.id.toString()).emit('new_message', newMessage);
});

// API to get all messages in a conversation
app.get('/conversations/:userId/:otherUserId/messages', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const otherUserId = parseInt(req.params.otherUserId);

    const { messages, unreadCount } = await getConversation(userId, otherUserId);

    // Mark all unread messages as read for the user requesting the messages
    await prisma.message.updateMany({
        where: {
            receiverId: userId,
            senderId: otherUserId,
            status: 'unread'
        },
        data: { status: 'read' }
    });

    res.json(messages);
});

// API to mark a specific message as read
app.post('/messages/:messageId/read', async (req, res) => {
    const { messageId } = req.params;

    // Update the message status to 'read'
    const updatedMessage = await prisma.message.update({
        where: { id: parseInt(messageId) },
        data: { status: 'read' }
    });

    res.status(200).json({ status: 'success' });
});

// WebSocket connection for real-time messaging
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register the user to a socket
    socket.on('register', async (userId) => {
        console.log(`User ${userId} registered to WebSocket`);
        socket.join(userId.toString());  // Join a room based on user ID
    });

    // Handle message sending from WebSocket
    socket.on('send_message', async ({ senderId, receiverId, message }) => {
        const newMessage = await prisma.message.create({
            data: {
                senderId,
                receiverId,
                message,
                status: 'unread',
                timestamp: new Date().toISOString()
            }
        });

        io.to(receiverId.toString()).emit('new_message', newMessage); // Emit to receiver's room
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server on port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
