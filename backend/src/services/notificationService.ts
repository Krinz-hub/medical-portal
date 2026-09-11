import { Notification, NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

/**
 * Notification Service Abstraction (Future AWS SNS/SES Compatibility)
 */
export interface INotificationService {
  sendNotification(params: {
    userId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<void>;
  getUserNotifications(userId: string | mongoose.Types.ObjectId): Promise<any[]>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
}

export class DatabaseNotificationService implements INotificationService {
  async sendNotification(params: {
    userId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await Notification.create({
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        metadata: params.metadata || {}
      });
      console.log(`[Notification Delivered] To: ${params.userId} | Type: ${params.type} | "${params.title}"`);
    } catch (error) {
      console.error('Failed to create notification record:', error);
    }
  }

  async getUserNotifications(userId: string | mongoose.Types.ObjectId): Promise<any[]> {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
  }
}

/**
 * Future AWS SNS/SES Notification Implementation
 */
export class AWSNotificationService implements INotificationService {
  async sendNotification(params: {
    userId: string | mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // 1. Save to MongoDB
    await Notification.create(params);
    // 2. Publish to AWS SNS/SES
    console.log(`[AWS SNS/SES] Dispatching message: ${params.title} to target user ${params.userId}`);
  }

  async getUserNotifications(userId: string | mongoose.Types.ObjectId): Promise<any[]> {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true });
  }
}

export const notificationService: INotificationService = new DatabaseNotificationService();
