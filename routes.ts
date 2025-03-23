import express, { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCourseSchema, insertLessonSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiRouter = Router();

  // Middleware to parse JSON
  apiRouter.use(express.json());

  // Error handling middleware
  const handleErrors = (err: any, req: any, res: any, next: any) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    next(err);
  };
  
  apiRouter.use(handleErrors);

  // Auth Endpoints
  apiRouter.post('/api/auth/telegram', async (req, res) => {
    try {
      const { telegramId, displayName, username } = req.body;
      
      if (!telegramId || !displayName || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if user already exists
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Generate unique referral code
        const referralCode = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Create new user
        user = await storage.createUser({
          telegramId,
          displayName,
          username,
          password: '', // Not using password for Telegram auth
          referralCode,
          isAdmin: false,
          walletAddress: null,
          referredBy: null
        });
      }
      
      return res.json({
        user: {
          id: user.id,
          displayName: user.displayName,
          telegramId: user.telegramId,
          username: user.username,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          balance: user.balance,
          walletAddress: user.walletAddress,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // User Endpoints
  apiRouter.get('/api/users/me', async (req, res) => {
    try {
      // In a real app, we'd get the user from the session
      // For now, return Alex as the demo user
      const user = await storage.getUser(2);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({
        id: user.id,
        displayName: user.displayName,
        telegramId: user.telegramId,
        username: user.username,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        balance: user.balance,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });
  
  apiRouter.patch('/api/users/wallet', async (req, res) => {
    try {
      const { userId, walletAddress } = req.body;
      
      if (!userId || !walletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await storage.updateUser(userId, { walletAddress });
      
      return res.json({
        success: true,
        walletAddress: updatedUser?.walletAddress
      });
    } catch (error) {
      console.error('Update wallet error:', error);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }
  });

  // Course Endpoints
  apiRouter.get('/api/courses', async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const courses = await storage.getAllCourses(activeOnly);
      
      return res.json(courses);
    } catch (error) {
      console.error('Get courses error:', error);
      return res.status(500).json({ error: 'Failed to get courses' });
    }
  });
  
  apiRouter.get('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      // Get lessons for this course
      const lessons = await storage.getLessonsByCourse(courseId);
      
      return res.json({
        ...course,
        lessons
      });
    } catch (error) {
      console.error('Get course error:', error);
      return res.status(500).json({ error: 'Failed to get course' });
    }
  });
  
  apiRouter.post('/api/courses', async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      
      return res.status(201).json(course);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error('Create course error:', error);
      return res.status(500).json({ error: 'Failed to create course' });
    }
  });
  
  apiRouter.patch('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      
      return res.json(updatedCourse);
    } catch (error) {
      console.error('Update course error:', error);
      return res.status(500).json({ error: 'Failed to update course' });
    }
  });
  
  apiRouter.delete('/api/courses/:id', async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      
      const result = await storage.deleteCourse(courseId);
      
      if (!result) {
        return res.status(404).json({ error: 'Course not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Delete course error:', error);
      return res.status(500).json({ error: 'Failed to delete course' });
    }
  });

  // Lesson Endpoints
  apiRouter.get('/api/courses/:courseId/lessons', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid course ID' });
      }
      
      const lessons = await storage.getLessonsByCourse(courseId);
      
      return res.json(lessons);
    } catch (error) {
      console.error('Get lessons error:', error);
      return res.status(500).json({ error: 'Failed to get lessons' });
    }
  });
  
  apiRouter.get('/api/lessons/:id', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }
      
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      
      return res.json(lesson);
    } catch (error) {
      console.error('Get lesson error:', error);
      return res.status(500).json({ error: 'Failed to get lesson' });
    }
  });
  
  apiRouter.post('/api/lessons', async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      
      return res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error('Create lesson error:', error);
      return res.status(500).json({ error: 'Failed to create lesson' });
    }
  });
  
  apiRouter.patch('/api/lessons/:id', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }
      
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      
      const updatedLesson = await storage.updateLesson(lessonId, req.body);
      
      return res.json(updatedLesson);
    } catch (error) {
      console.error('Update lesson error:', error);
      return res.status(500).json({ error: 'Failed to update lesson' });
    }
  });
  
  apiRouter.delete('/api/lessons/:id', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid lesson ID' });
      }
      
      const result = await storage.deleteLesson(lessonId);
      
      if (!result) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Delete lesson error:', error);
      return res.status(500).json({ error: 'Failed to delete lesson' });
    }
  });

  // User Progress Endpoints
  apiRouter.get('/api/users/:userId/progress', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const userCourses = await storage.getUserCourses(userId);
      
      return res.json(userCourses);
    } catch (error) {
      console.error('Get user progress error:', error);
      return res.status(500).json({ error: 'Failed to get user progress' });
    }
  });
  
  apiRouter.post('/api/users/:userId/courses/:courseId/start', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid user ID or course ID' });
      }
      
      // Check if user already started this course
      let userCourse = await storage.getUserCourse(userId, courseId);
      
      if (!userCourse) {
        userCourse = await storage.createUserCourse({
          userId,
          courseId
        });
      }
      
      return res.json(userCourse);
    } catch (error) {
      console.error('Start course error:', error);
      return res.status(500).json({ error: 'Failed to start course' });
    }
  });
  
  apiRouter.post('/api/users/:userId/lessons/:lessonId/complete', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const lessonId = parseInt(req.params.lessonId);
      
      if (isNaN(userId) || isNaN(lessonId)) {
        return res.status(400).json({ error: 'Invalid user ID or lesson ID' });
      }
      
      // Get the lesson to find its course
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }
      
      // Check if user already completed this lesson
      let userLesson = await storage.getUserLesson(userId, lessonId);
      
      if (!userLesson) {
        userLesson = await storage.createUserLesson({
          userId,
          lessonId,
          courseId: lesson.courseId
        });
      }
      
      // Mark lesson as completed
      userLesson = await storage.updateUserLesson(userLesson.id, {
        completed: true,
        completedAt: new Date()
      });
      
      // Update course progress
      const courseLessons = await storage.getLessonsByCourse(lesson.courseId);
      const userLessons = await storage.getUserLessonsByCourse(userId, lesson.courseId);
      const completedLessons = userLessons.filter(ul => ul.completed);
      
      // Calculate progress percentage
      const progress = Math.round((completedLessons.length / courseLessons.length) * 100);
      
      // Get the user course record
      let userCourse = await storage.getUserCourse(userId, lesson.courseId);
      
      if (!userCourse) {
        userCourse = await storage.createUserCourse({
          userId,
          courseId: lesson.courseId
        });
      }
      
      // Update the progress
      userCourse = await storage.updateUserCourse(userCourse.id, { progress });
      
      // Check if course is completed
      if (progress === 100 && !userCourse.completedAt) {
        userCourse = await storage.updateUserCourse(userCourse.id, {
          completedAt: new Date()
        });
      }
      
      return res.json({
        userLesson,
        progress,
        courseCompleted: progress === 100
      });
    } catch (error) {
      console.error('Complete lesson error:', error);
      return res.status(500).json({ error: 'Failed to complete lesson' });
    }
  });

  // Certificate Endpoints
  apiRouter.get('/api/users/:userId/certificates', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const certificates = await storage.getUserCertificates(userId);
      
      return res.json(certificates);
    } catch (error) {
      console.error('Get certificates error:', error);
      return res.status(500).json({ error: 'Failed to get certificates' });
    }
  });
  
  apiRouter.get('/api/certificates/:id', async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      
      if (isNaN(certificateId)) {
        return res.status(400).json({ error: 'Invalid certificate ID' });
      }
      
      const certificate = await storage.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' });
      }
      
      return res.json(certificate);
    } catch (error) {
      console.error('Get certificate error:', error);
      return res.status(500).json({ error: 'Failed to get certificate' });
    }
  });
  
  apiRouter.post('/api/users/:userId/courses/:courseId/certificate', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid user ID or course ID' });
      }
      
      // Get the user and course
      const user = await storage.getUser(userId);
      const course = await storage.getCourse(courseId);
      
      if (!user || !course) {
        return res.status(404).json({ error: 'User or course not found' });
      }
      
      // Check if user completed the course
      const userCourse = await storage.getUserCourse(userId, courseId);
      
      if (!userCourse || !userCourse.completedAt) {
        return res.status(400).json({ error: 'Course not completed' });
      }
      
      // Check if certificate already exists
      const existingCertificates = await storage.getUserCertificates(userId);
      const hasCertificate = existingCertificates.some(cert => cert.courseId === courseId);
      
      if (hasCertificate) {
        return res.status(400).json({ error: 'Certificate already issued' });
      }
      
      // Generate token ID (would be from blockchain in production)
      const tokenId = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Create certificate
      const certificate = await storage.createCertificate({
        userId,
        courseId,
        name: user.displayName,
        courseTitle: course.title,
        issuedDate: new Date(),
        tokenId,
        txHash: '0x' + Math.random().toString(16).substring(2, 14)
      });
      
      return res.status(201).json(certificate);
    } catch (error) {
      console.error('Create certificate error:', error);
      return res.status(500).json({ error: 'Failed to create certificate' });
    }
  });

  // Reward Endpoints
  apiRouter.get('/api/users/:userId/rewards', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const rewards = await storage.getUserRewards(userId);
      
      return res.json(rewards);
    } catch (error) {
      console.error('Get rewards error:', error);
      return res.status(500).json({ error: 'Failed to get rewards' });
    }
  });
  
  // Leaderboard Endpoints
  apiRouter.get('/api/leaderboard', async (req, res) => {
    try {
      const period = req.query.period as string | undefined;
      const leaderboard = await storage.getLeaderboard(period);
      
      return res.json(leaderboard);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return res.status(500).json({ error: 'Failed to get leaderboard data' });
    }
  });
  
  apiRouter.post('/api/users/:userId/courses/:courseId/reward', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: 'Invalid user ID or course ID' });
      }
      
      // Get the user and course
      const user = await storage.getUser(userId);
      const course = await storage.getCourse(courseId);
      
      if (!user || !course) {
        return res.status(404).json({ error: 'User or course not found' });
      }
      
      // Check if user completed the course
      const userCourse = await storage.getUserCourse(userId, courseId);
      
      if (!userCourse || !userCourse.completedAt) {
        return res.status(400).json({ error: 'Course not completed' });
      }
      
      // Check if reward already claimed
      if (userCourse.rewardClaimed) {
        return res.status(400).json({ error: 'Reward already claimed' });
      }
      
      // Generate random reward amount between min and max
      const rewardAmount = parseFloat((Math.random() * (course.maxReward - course.minReward) + course.minReward).toFixed(2));
      
      // Generate transaction hash (would be from blockchain in production)
      const txHash = '0x' + Math.random().toString(16).substring(2, 14);
      
      // Create reward
      const reward = await storage.createReward({
        userId,
        amount: rewardAmount,
        reason: 'Course Completion',
        courseId,
        txHash
      });
      
      // Update user balance
      await storage.updateUser(userId, {
        balance: (user.balance || 0) + rewardAmount
      });
      
      // Mark reward as claimed
      await storage.updateUserCourse(userCourse.id, {
        rewardClaimed: true,
        rewardAmount
      });
      
      return res.status(201).json({
        reward,
        newBalance: (user.balance || 0) + rewardAmount
      });
    } catch (error) {
      console.error('Create reward error:', error);
      return res.status(500).json({ error: 'Failed to create reward' });
    }
  });

  apiRouter.post('/api/users/:userId/referral', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { referralCode } = req.body;
      
      if (isNaN(userId) || !referralCode) {
        return res.status(400).json({ error: 'Invalid user ID or referral code' });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Find the referrer
      const referrer = Array.from((await storage.getAllUsers()) || [])
        .find(u => u.referralCode === referralCode);
      
      if (!referrer) {
        return res.status(404).json({ error: 'Referrer not found' });
      }
      
      // Check if user already has a referrer
      if (user.referredBy) {
        return res.status(400).json({ error: 'User already has a referrer' });
      }
      
      // Update user with referrer
      await storage.updateUser(userId, {
        referredBy: referrer.id.toString()
      });
      
      // Increment referrer's count
      await storage.updateUser(referrer.id, {
        referralCount: (referrer.referralCount || 0) + 1
      });
      
      // Create referral reward (simulated)
      const rewardAmount = 0.05; // Fixed amount for simplicity
      const txHash = '0x' + Math.random().toString(16).substring(2, 14);
      
      const reward = await storage.createReward({
        userId: referrer.id,
        amount: rewardAmount,
        reason: 'Referral Bonus',
        courseId: null,
        txHash
      });
      
      // Update referrer's balance
      await storage.updateUser(referrer.id, {
        balance: (referrer.balance || 0) + rewardAmount
      });
      
      return res.json({
        success: true,
        referrer: referrer.displayName
      });
    } catch (error) {
      console.error('Referral error:', error);
      return res.status(500).json({ error: 'Failed to process referral' });
    }
  });

  app.use(apiRouter);

  return httpServer;
}
