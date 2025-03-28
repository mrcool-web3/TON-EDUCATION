import express, { Router, type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCourseSchema, 
  insertLessonSchema, 
  insertReferralTierSchema,
  insertAdminSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { tonService } from "./services/tonService";
import { setupAuth } from "./auth";

// Helper function to format date for certificate issuance (YYYY-MM-DD format)
function formatDateForCertificate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const apiRouter = Router();

  // Middleware to parse JSON
  apiRouter.use(express.json());
  
  // Setup authentication with sessions
  setupAuth(app);

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
          referralTier: user.referralTier,
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
      // Check if user is authenticated through session
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        // Return the authenticated user
        return res.json({
          id: req.user.id,
          displayName: req.user.displayName,
          telegramId: req.user.telegramId,
          username: req.user.username,
          referralCode: req.user.referralCode,
          referralCount: req.user.referralCount,
          referralTier: req.user.referralTier,
          balance: req.user.balance,
          walletAddress: req.user.walletAddress,
          isAdmin: req.user.isAdmin
        });
      }
      
      // If not authenticated through session, return the first user as a fallback
      // This is only for development purposes
      const user = await storage.getUser(1);
      
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
        referralTier: user.referralTier,
        balance: user.balance,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ error: 'Failed to get user' });
    }
  });
  
  apiRouter.patch('/api/users/:userId/wallet', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { walletAddress } = req.body;
      
      if (isNaN(userId) || !walletAddress) {
        return res.status(400).json({ error: 'Invalid user ID or missing wallet address' });
      }
      
      // Validate TON wallet address
      if (tonService.isValidAddress && !tonService.isValidAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid TON wallet address' });
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
  
  // New endpoint for connected wallet from TonConnect
  apiRouter.post('/api/user/wallet', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Missing wallet address' });
      }
      
      // Validate TON wallet address
      if (tonService.isValidAddress && !tonService.isValidAddress(walletAddress)) {
        return res.status(400).json({ error: 'Invalid TON wallet address' });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { walletAddress });
      
      return res.json({
        success: true,
        walletAddress: updatedUser?.walletAddress
      });
    } catch (error) {
      console.error('Update wallet error:', error);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }
  });

  // Referral Tier Endpoints
  apiRouter.get('/api/referral-tiers', async (req, res) => {
    try {
      const tiers = await storage.getAllReferralTiers();
      return res.json(tiers);
    } catch (error) {
      console.error('Get referral tiers error:', error);
      return res.status(500).json({ error: 'Failed to get referral tiers' });
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
      if (userCourse) {
        const updatedUserCourse = await storage.updateUserCourse(userCourse.id, { progress });
        
        // Check if course is completed
        if (updatedUserCourse && progress === 100 && !updatedUserCourse.completedAt) {
          await storage.updateUserCourse(updatedUserCourse.id, {
            completedAt: new Date()
          });
        }
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
      
      // Check if user has wallet address for TON SBT
      if (!user.walletAddress) {
        return res.status(400).json({ error: 'User does not have a wallet address set up' });
      }
      
      // Default skills for courses without the skills field
      const defaultSkills = ['Web3', 'Blockchain', 'TON'];
      
      // Extract course skills or use defaults, handling potential undefined field
      const courseSkills = course.skills && Array.isArray(course.skills) ? course.skills : 
                          (course.level ? [course.level, ...defaultSkills] : defaultSkills);
        
      // Generate a certificate description
      const certificateDescription = `This certifies that ${user.displayName} has successfully completed the "${course.title}" course, demonstrating proficiency in ${courseSkills.join(', ')}.`;
      
      // For backwards compatibility, derive category from course level if needed
      const courseCategory = course.category || 
                            (course.level === 'advanced' ? 'advanced' : 
                             course.level === 'intermediate' ? 'intermediate' : 'beginner');
      
      // Pick a template ID based on derived category
      const templateId = courseCategory === 'advanced' ? 'premium' : 
                         courseCategory === 'intermediate' ? 'silver' : 'default';
      
      // Current date
      const currentDate = new Date();
      
      // Calculate valid until date (1 year from now) if needed
      const validUntil = new Date(currentDate);
      validUntil.setFullYear(validUntil.getFullYear() + 1);
            
      // Mint SBT certificate on TON blockchain via TON service with enhanced metadata
      const mintResult = await tonService.mintCertificate(
        user.walletAddress,
        {
          name: user.displayName,
          courseTitle: course.title,
          issuedDate: currentDate.toISOString(),
          templateId: templateId,
          description: certificateDescription,
          skills: courseSkills,
          issuer: 'TON EDUCATION',
          certificateType: 'completion',
          backgroundColor: '#f0f9ff', // Light blue background
          borderColor: '#0ea5e9',     // Blue border
          validUntil: validUntil.toISOString(),
          additionalMetadata: {
            courseCategory: courseCategory,
            courseDuration: course.duration || 'N/A',
            achievementLevel: course.level || 'beginner',
            institutionLogo: 'https://ton.org/assets/ton_logo.svg'
          }
        }
      );
      
      if (!mintResult.success) {
        return res.status(500).json({ error: mintResult.error || 'Failed to mint certificate' });
      }
      
      // Create certificate with actual blockchain data and enhanced metadata
      // Using formatted date string for issuedDate that works with the date column type
      const certificate = await storage.createCertificate({
        userId,
        courseId,
        name: user.displayName,
        courseTitle: course.title,
        issuedDate: formatDateForCertificate(currentDate),
        tokenId: mintResult.tokenId || '0',
        txHash: mintResult.txHash || '0x0',
        templateId: templateId,
        description: certificateDescription,
        skills: courseSkills,
        issuer: 'TON EDUCATION',
        certificateType: 'completion',
        backgroundColor: '#f0f9ff',
        borderColor: '#0ea5e9',
        validUntil: formatDateForCertificate(validUntil),
        metadataJson: JSON.stringify(mintResult.metadata || {})
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
  
  // Referral Tier Endpoints
  apiRouter.get('/api/referral-tiers', async (req, res) => {
    try {
      const tiers = await storage.getAllReferralTiers();
      return res.json(tiers);
    } catch (error) {
      console.error('Get referral tiers error:', error);
      return res.status(500).json({ error: 'Failed to get referral tiers' });
    }
  });
  
  apiRouter.get('/api/users/:userId/referral-tier', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Get the tier details
      const tier = await storage.getReferralTier(user.referralTier);
      
      // Find the next tier (if any)
      const allTiers = await storage.getAllReferralTiers();
      const nextTier = allTiers
        .filter(t => t.requiredReferrals > user.referralCount)
        .sort((a, b) => a.requiredReferrals - b.requiredReferrals)[0] || null;
      
      // Return user's referral tier info
      return res.json({
        tier: user.referralTier,
        tierDetails: tier || null,
        referralCount: user.referralCount,
        nextTier: nextTier
      });
    } catch (error) {
      console.error('Get user referral tier error:', error);
      return res.status(500).json({ error: 'Failed to get user referral tier' });
    }
  });
  
  apiRouter.post('/api/referral-tiers', async (req, res) => {
    try {
      // Require admin access
      if (!req.body.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const tierData = insertReferralTierSchema.parse(req.body);
      const tier = await storage.createReferralTier(tierData);
      
      return res.status(201).json(tier);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error('Create referral tier error:', error);
      return res.status(500).json({ error: 'Failed to create referral tier' });
    }
  });
  
  apiRouter.patch('/api/referral-tiers/:id', async (req, res) => {
    try {
      // Require admin access
      if (!req.body.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const tierId = parseInt(req.params.id);
      
      if (isNaN(tierId)) {
        return res.status(400).json({ error: 'Invalid tier ID' });
      }
      
      const tier = await storage.getReferralTier(tierId);
      
      if (!tier) {
        return res.status(404).json({ error: 'Referral tier not found' });
      }
      
      const updatedTier = await storage.updateReferralTier(tierId, req.body);
      
      return res.json(updatedTier);
    } catch (error) {
      console.error('Update referral tier error:', error);
      return res.status(500).json({ error: 'Failed to update referral tier' });
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
  
  // TON News Endpoint
  apiRouter.get('/api/ton-news', (req, res) => {
    try {
      // In a production environment, this would fetch from TON's official channels using their APIs
      // For now, returning static data
      const news = [
        {
          id: '1',
          title: 'TON Launches New Developer Program',
          content: 'The TON Foundation announced a $10M grant program for Web3 developers building on TON blockchain.',
          date: 'March 28, 2025',
          source: 'telegram',
          url: 'https://t.me/toncoin',
          imageUrl: '/ton-dev-program.jpg'
        },
        {
          id: '2',
          title: 'TON Coin Reaches New All-Time High',
          content: 'TON Coin reached a new all-time high of $9.75 after major exchange integrations and ecosystem growth.',
          date: 'March 27, 2025',
          source: 'twitter',
          url: 'https://x.com/ton_blockchain'
        },
        {
          id: '3',
          title: 'New TON Bridge Simplifies Cross-Chain Transfers',
          content: 'The new TON Bridge enables seamless asset transfers between TON and major blockchains like Ethereum and BSC.',
          date: 'March 25, 2025',
          source: 'telegram',
          url: 'https://t.me/tonblockchain'
        },
        {
          id: '4',
          title: 'TON Hackathon Announces Winners',
          content: 'The global TON hackathon concluded with innovative projects in DeFi, Gaming, and Social categories sharing $1M in prizes.',
          date: 'March 22, 2025',
          source: 'twitter',
          url: 'https://x.com/ton_blockchain'
        },
        {
          id: '5',
          title: 'TON Connect 2.0 Released for Seamless Wallet Integration',
          content: 'The new TON Connect 2.0 protocol makes it easier for developers to integrate TON wallets into their dApps.',
          date: 'March 20, 2025',
          source: 'telegram',
          url: 'https://t.me/tonblockchain'
        }
      ];
      
      return res.json(news);
    } catch (error) {
      console.error('Get TON news error:', error);
      return res.status(500).json({ error: 'Failed to get TON news' });
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
      
      // Check if user has wallet address for TON transfer
      if (!user.walletAddress) {
        return res.status(400).json({ error: 'User does not have a wallet address set up' });
      }
      
      // Send TON to user's wallet using TON service
      const transferResult = await tonService.sendTon(
        user.walletAddress,
        rewardAmount,
        `TON Education - ${course.title} Completion Reward`
      );
      
      if (!transferResult.success) {
        return res.status(500).json({ error: transferResult.error || 'Failed to transfer TON' });
      }
      
      // Create reward record with actual transaction data
      const reward = await storage.createReward({
        userId,
        amount: rewardAmount,
        reason: 'Course Completion',
        courseId,
        txHash: transferResult.txHash || '0x0'
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
      
      // Update referrer's tier based on new referral count
      await storage.updateUserReferralTier(referrer.id);
      
      // Calculate reward amount based on referrer's tier
      const rewardAmount = await storage.getReferralRewardAmount(referrer.id);
      let txHash = '0x0';
      
      // Check if referrer has wallet address for TON transfer
      if (referrer.walletAddress) {
        // Send TON to referrer's wallet using TON service
        const transferResult = await tonService.sendTon(
          referrer.walletAddress,
          rewardAmount,
          `TON Education - Referral Bonus`
        );
        
        if (transferResult.success) {
          txHash = transferResult.txHash || '0x0';
        } else {
          console.error('Failed to transfer TON for referral:', transferResult.error);
        }
      }
      
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
  
  // Admin Authentication Endpoints
  apiRouter.post('/api/admin/register', async (req, res) => {
    try {
      const adminData = insertAdminSchema.parse(req.body);
      
      // Check if email already exists
      const existingAdmin = await storage.getAdminByEmail(adminData.email);
      if (existingAdmin) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      
      // In a production app, we would hash the password here
      // const hashedPassword = await bcrypt.hash(adminData.password, 10);
      
      // Create the admin account
      const admin = await storage.createAdmin({
        ...adminData,
        // password: hashedPassword // In production, use the hashed password
      });
      
      // Don't return the password in response
      const { password, ...adminWithoutPassword } = admin;
      
      return res.status(201).json(adminWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      console.error('Admin registration error:', error);
      return res.status(500).json({ error: 'Failed to register admin account' });
    }
  });
  
  apiRouter.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      // Find admin by email
      const admin = await storage.getAdminByEmail(email);
      
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // In a production app, we would verify the password hash
      // const passwordValid = await bcrypt.compare(password, admin.password);
      
      // For demo, we'll do a simple comparison
      const passwordValid = password === admin.password;
      
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Update last login timestamp
      await storage.updateAdminLastLogin(admin.id);
      
      // Generate a JWT token (in a real app)
      // const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      // For demo, we'll use a fake token
      const token = `demo_token_${admin.id}_${Date.now()}`;
      
      // Don't return the password in response
      const { password: _, ...adminWithoutPassword } = admin;
      
      return res.json({
        token,
        admin: adminWithoutPassword
      });
    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Admin Data Endpoints
  apiRouter.get('/api/admin/users', async (req, res) => {
    try {
      // In a real app, verify the admin token and permissions
      
      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ error: 'Failed to get users' });
    }
  });
  
  apiRouter.get('/api/admin/courses', async (req, res) => {
    try {
      // In a real app, verify the admin token and permissions
      
      const courses = await storage.getAllCourses(false); // Get all courses including inactive
      return res.json(courses);
    } catch (error) {
      console.error('Get all courses error:', error);
      return res.status(500).json({ error: 'Failed to get courses' });
    }
  });
  
  apiRouter.get('/api/admin/certificates', async (req, res) => {
    try {
      // In a real app, verify the admin token and permissions
      
      const certificates = await storage.getAllCertificates();
      return res.json(certificates);
    } catch (error) {
      console.error('Get all certificates error:', error);
      return res.status(500).json({ error: 'Failed to get certificates' });
    }
  });
  
  apiRouter.get('/api/admin/rewards', async (req, res) => {
    try {
      // In a real app, verify the admin token and permissions
      
      const rewards = await storage.getAllRewards();
      return res.json(rewards);
    } catch (error) {
      console.error('Get all rewards error:', error);
      return res.status(500).json({ error: 'Failed to get rewards' });
    }
  });
  
  apiRouter.get('/api/admin/admins', async (req, res) => {
    try {
      // In a real app, verify the admin token and permissions
      // Only superadmins should access this
      
      const admins = await storage.getAllAdmins();
      
      // Don't return passwords
      const adminsWithoutPasswords = admins.map(admin => {
        const { password, ...adminWithoutPassword } = admin;
        return adminWithoutPassword;
      });
      
      return res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error('Get all admins error:', error);
      return res.status(500).json({ error: 'Failed to get admins' });
    }
  });

  // Health check endpoint
  apiRouter.get('/api/health', (req, res) => {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };
    
    return res.json(status);
  });

  // Root health check for kubernetes/docker health probes
  app.get('/health', (req, res) => {
    return res.json({ status: 'ok' });
  });

  app.use(apiRouter);

  return httpServer;
}
