import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { PrismaService } from '../prisma/prisma.service';

export interface MessagePayload {
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Date;
}

export interface UserInfo {
    id: string;
    name: string;
    email: string;
}

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userInfo?: UserInfo;
}

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
})
export class GatewayService implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer() server: Server;

    private connectedUsers: Map<string, { socketId: string, userInfo: UserInfo }> = new Map();

    constructor(private prismaService: PrismaService) {}

    afterInit(server: Server) {
        console.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
        console.log(`Client connected: ${client.id}`);
        console.log('Handshake query:', client.handshake.query);
        
        client.emit('connected', { message: 'Successfully connected to chat server', socketId: client.id });
    }

    handleDisconnect(client: AuthenticatedSocket) {
        console.log(`Client disconnected: ${client.id}`);
        
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            console.log(`User ${client.userId} disconnected`);
            
            this.broadcastOnlineUsers();
        }
    }

    @SubscribeMessage('join')
    async handleJoin(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { userId: string }) {
        if (!data.userId) {
            client.emit('error', { message: 'User ID is required to join chat' });
            return;
        }
        
        try {
            const user = await this.prismaService.user.findUnique({
                where: { id: data.userId }
            });
            
            if (!user) {
                client.emit('error', { message: 'User not found in database' });
                return;
            }
            
            const userInfo: UserInfo = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            
            client.userId = data.userId;
            client.userInfo = userInfo;
            
            this.connectedUsers.set(data.userId, { 
                socketId: client.id, 
                userInfo: userInfo 
            });
            
            console.log(`User ${data.userId} (${user.name}) joined chat with socket ${client.id}`);
            client.emit('joined', { 
                message: 'Successfully joined chat', 
                userId: data.userId,
                userInfo: userInfo
            });
            
            this.broadcastOnlineUsers();
            
        } catch (error) {
            console.error('Error joining chat:', error);
            client.emit('error', { message: 'Failed to join chat' });
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: AuthenticatedSocket, 
        @MessageBody() payload: MessagePayload
    ) {
        if (!client.userId) {
            client.emit('error', { message: 'You must join the chat first' });
            return;
        }
        
        if (client.userId !== payload.senderId) {
            client.emit('error', { message: 'Sender ID does not match your user ID' });
            return;
        }
        
        console.log('Received message:', payload);
        
        const messageWithTimestamp = {
            ...payload,
            timestamp: payload.timestamp || new Date()
        };
        
        const receiverInfo = this.connectedUsers.get(payload.receiverId);
        if (receiverInfo) {
            this.server.to(receiverInfo.socketId).emit('receiveMessage', messageWithTimestamp);
            console.log(`Message sent to user ${payload.receiverId}`);
        } else {
            console.log(`User ${payload.receiverId} is not connected`);
            client.emit('messageError', { message: `User ${payload.receiverId} is not connected` });
        }
        
        client.emit('messageSent', { ...messageWithTimestamp, status: 'delivered' });
    }

    @SubscribeMessage('getOnlineUsers')
    handleGetOnlineUsers(@ConnectedSocket() client: AuthenticatedSocket) {
        const onlineUsers = Array.from(this.connectedUsers.values()).map(item => item.userInfo);
        client.emit('onlineUsers', { users: onlineUsers });
    }

    @SubscribeMessage('getAllUsers')
    async handleGetAllUsers(@ConnectedSocket() client: AuthenticatedSocket) {
        try {
            const users = await this.prismaService.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });
            
            client.emit('allUsers', { users: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            client.emit('error', { message: 'Failed to fetch users' });
        }
    }

    private broadcastOnlineUsers() {
        const onlineUsers = Array.from(this.connectedUsers.values()).map(item => item.userInfo);
        
        this.server.emit('onlineUsersUpdate', { users: onlineUsers });
    }
}