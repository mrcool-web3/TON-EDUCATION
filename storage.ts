import { 
  users, User, InsertUser,
  courses, Course, InsertCourse,
  lessons, Lesson, InsertLesson,
  userCourses, UserCourse, InsertUserCourse,
  userLessons, UserLesson, InsertUserLesson,
  certificates, Certificate, InsertCertificate,
  rewards, Reward, InsertReward,
  referralTiers, ReferralTier, InsertReferralTier,
  admins, Admin, InsertAdmin
} from "@shared/schema";

// Storage interface
import session from "express-session";
import connectPg from "connect-pg-simple";
import createMemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getAllCourses(activeOnly?: boolean): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  
  // UserCourse operations
  getUserCourse(userId: number, courseId: number): Promise<UserCourse | undefined>;
  getUserCourses(userId: number): Promise<UserCourse[]>;
  createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse>;
  updateUserCourse(id: number, userCourse: Partial<UserCourse>): Promise<UserCourse | undefined>;
  getAllUserCourses(): Promise<UserCourse[]>;
  
  // UserLesson operations
  getUserLesson(userId: number, lessonId: number): Promise<UserLesson | undefined>;
  getUserLessonsByCourse(userId: number, courseId: number): Promise<UserLesson[]>;
  createUserLesson(userLesson: InsertUserLesson): Promise<UserLesson>;
  updateUserLesson(id: number, userLesson: Partial<UserLesson>): Promise<UserLesson | undefined>;
  
  // Certificate operations
  getUserCertificates(userId: number): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getAllCertificates(): Promise<Certificate[]>;
  
  // Reward operations
  getUserRewards(userId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  getAllRewards(): Promise<Reward[]>;
  
  // Referral Tier operations
  getReferralTier(tier: number): Promise<ReferralTier | undefined>;
  getAllReferralTiers(): Promise<ReferralTier[]>;
  createReferralTier(tier: InsertReferralTier): Promise<ReferralTier>;
  updateReferralTier(id: number, tier: Partial<ReferralTier>): Promise<ReferralTier | undefined>;
  
  // User Referral operations
  updateUserReferralTier(userId: number): Promise<User | undefined>;
  getReferralRewardAmount(userId: number): Promise<number>;
  
  // Leaderboard operations
  getLeaderboard(period?: string): Promise<Array<{
    id: number;
    displayName: string;
    username: string;
    walletAddress: string | null;
    points: number;
    completedCourses: number;
    certificates: number;
  }>>;
  
  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: number, admin: Partial<Admin>): Promise<Admin | undefined>;
  updateAdminLastLogin(id: number): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private lessons: Map<number, Lesson>;
  private userCourses: Map<number, UserCourse>;
  private userLessons: Map<number, UserLesson>;
  private certificates: Map<number, Certificate>;
  private rewards: Map<number, Reward>;
  private referralTiers: Map<number, ReferralTier>;
  private admins: Map<number, Admin>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private lessonIdCounter: number;
  private userCourseIdCounter: number;
  private userLessonIdCounter: number;
  private certificateIdCounter: number;
  private rewardIdCounter: number;
  private referralTierIdCounter: number;
  private adminIdCounter: number;
  
  constructor() {
    // Initialize in-memory session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Clear expired sessions once per day
    });
    
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.userCourses = new Map();
    this.userLessons = new Map();
    this.certificates = new Map();
    this.rewards = new Map();
    this.referralTiers = new Map();
    this.admins = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.lessonIdCounter = 1;
    this.userCourseIdCounter = 1;
    this.userLessonIdCounter = 1;
    this.certificateIdCounter = 1;
    this.rewardIdCounter = 1;
    this.referralTierIdCounter = 1;
    this.adminIdCounter = 1;
    
    this.seedData();
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.telegramId === telegramId);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser = { 
      ...user, 
      id, 
      createdAt: new Date(), 
      balance: 0, 
      referralCount: 0,
      referralTier: 0, // Default tier (Base)
      walletAddress: user.walletAddress || null,
      referredBy: user.referredBy || null,
      isAdmin: user.isAdmin || false
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getAllCourses(activeOnly: boolean = true): Promise<Course[]> {
    const allCourses = Array.from(this.courses.values());
    return activeOnly ? allCourses.filter(course => course.active) : allCourses;
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const newCourse = { ...course, id, createdAt: new Date(), active: true };
    this.courses.set(id, newCourse);
    return newCourse;
  }
  
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }
  
  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  
  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter(lesson => lesson.courseId === courseId)
      .sort((a, b) => a.orderNumber - b.orderNumber);
  }
  
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = this.lessonIdCounter++;
    const newLesson = { ...lesson, id, createdAt: new Date() };
    this.lessons.set(id, newLesson);
    return newLesson;
  }
  
  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined> {
    const lesson = this.lessons.get(id);
    if (!lesson) return undefined;
    
    const updatedLesson = { ...lesson, ...lessonData };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    return this.lessons.delete(id);
  }
  
  // UserCourse operations
  async getUserCourse(userId: number, courseId: number): Promise<UserCourse | undefined> {
    return Array.from(this.userCourses.values())
      .find(uc => uc.userId === userId && uc.courseId === courseId);
  }
  
  async getUserCourses(userId: number): Promise<UserCourse[]> {
    return Array.from(this.userCourses.values())
      .filter(uc => uc.userId === userId);
  }
  
  async createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse> {
    const id = this.userCourseIdCounter++;
    const newUserCourse = { 
      ...userCourse, 
      id, 
      progress: 0, 
      startedAt: new Date(), 
      completedAt: null, 
      rewardClaimed: false, 
      rewardAmount: null 
    };
    this.userCourses.set(id, newUserCourse);
    return newUserCourse;
  }
  
  async updateUserCourse(id: number, userCourseData: Partial<UserCourse>): Promise<UserCourse | undefined> {
    const userCourse = this.userCourses.get(id);
    if (!userCourse) return undefined;
    
    const updatedUserCourse = { ...userCourse, ...userCourseData };
    this.userCourses.set(id, updatedUserCourse);
    return updatedUserCourse;
  }
  
  // UserLesson operations
  async getUserLesson(userId: number, lessonId: number): Promise<UserLesson | undefined> {
    return Array.from(this.userLessons.values())
      .find(ul => ul.userId === userId && ul.lessonId === lessonId);
  }
  
  async getUserLessonsByCourse(userId: number, courseId: number): Promise<UserLesson[]> {
    return Array.from(this.userLessons.values())
      .filter(ul => ul.userId === userId && ul.courseId === courseId);
  }
  
  async createUserLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const id = this.userLessonIdCounter++;
    const newUserLesson = { ...userLesson, id, completed: false, completedAt: null };
    this.userLessons.set(id, newUserLesson);
    return newUserLesson;
  }
  
  async updateUserLesson(id: number, userLessonData: Partial<UserLesson>): Promise<UserLesson | undefined> {
    const userLesson = this.userLessons.get(id);
    if (!userLesson) return undefined;
    
    const updatedUserLesson = { ...userLesson, ...userLessonData };
    this.userLessons.set(id, updatedUserLesson);
    return updatedUserLesson;
  }
  
  // Certificate operations
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    return Array.from(this.certificates.values())
      .filter(cert => cert.userId === userId);
  }
  
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }
  
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.certificateIdCounter++;
    const newCertificate = { 
      ...certificate, 
      id,
      tokenId: certificate.tokenId || null,
      txHash: certificate.txHash || null
    };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }
  
  // Reward operations
  async getUserRewards(userId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(reward => reward.userId === userId);
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const id = this.rewardIdCounter++;
    const newReward = { 
      ...reward, 
      id, 
      createdAt: new Date(),
      courseId: reward.courseId || null,
      txHash: reward.txHash || null
    };
    this.rewards.set(id, newReward);
    return newReward;
  }
  
  // Referral Tier operations
  async getReferralTier(tier: number): Promise<ReferralTier | undefined> {
    return Array.from(this.referralTiers.values())
      .find(t => t.tier === tier);
  }
  
  async getAllReferralTiers(): Promise<ReferralTier[]> {
    return Array.from(this.referralTiers.values())
      .sort((a, b) => a.tier - b.tier);
  }
  
  async createReferralTier(tier: InsertReferralTier): Promise<ReferralTier> {
    const id = this.referralTierIdCounter++;
    // Ensure icon has a value (null if not provided)
    const newTier = { 
      ...tier, 
      id, 
      icon: tier.icon || null 
    };
    this.referralTiers.set(id, newTier);
    return newTier;
  }
  
  async updateReferralTier(id: number, tierData: Partial<ReferralTier>): Promise<ReferralTier | undefined> {
    const tier = this.referralTiers.get(id);
    if (!tier) return undefined;
    
    const updatedTier = { ...tier, ...tierData };
    this.referralTiers.set(id, updatedTier);
    return updatedTier;
  }
  
  // User Referral operations
  async updateUserReferralTier(userId: number): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const tiers = await this.getAllReferralTiers();
    if (tiers.length === 0) return user; // No tiers defined
    
    // Sort tiers by required referrals (descending)
    const sortedTiers = [...tiers].sort((a, b) => b.requiredReferrals - a.requiredReferrals);
    
    // Find the highest tier the user qualifies for
    let newTier = 0; // Default to base tier
    for (const tier of sortedTiers) {
      if (user.referralCount >= tier.requiredReferrals) {
        newTier = tier.tier;
        break;
      }
    }
    
    // Update user's tier if it has changed
    if (user.referralTier !== newTier) {
      return this.updateUser(userId, { referralTier: newTier });
    }
    
    return user;
  }
  
  async getReferralRewardAmount(userId: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user) return 0.05; // Default reward amount
    
    const userTier = await this.getReferralTier(user.referralTier);
    if (!userTier) return 0.05; // Default if tier not found
    
    // Base reward * tier multiplier
    return 0.05 * userTier.rewardMultiplier;
  }
  
  // Get all users
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Get all user courses
  async getAllUserCourses(): Promise<UserCourse[]> {
    return Array.from(this.userCourses.values());
  }
  
  // Get all certificates
  async getAllCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values());
  }
  
  // Get all rewards
  async getAllRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }
  
  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    return this.admins.get(id);
  }
  
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(admin => admin.email === email);
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const id = this.adminIdCounter++;
    const newAdmin = { 
      ...admin, 
      id, 
      createdAt: new Date(), 
      lastLogin: null, 
      isActive: true,
      role: admin.role || "admin" // Ensure role is never undefined
    };
    this.admins.set(id, newAdmin);
    return newAdmin;
  }
  
  async updateAdmin(id: number, adminData: Partial<Admin>): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    
    const updatedAdmin = { ...admin, ...adminData };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }
  
  async updateAdminLastLogin(id: number): Promise<Admin | undefined> {
    const admin = this.admins.get(id);
    if (!admin) return undefined;
    
    const updatedAdmin = { ...admin, lastLogin: new Date() };
    this.admins.set(id, updatedAdmin);
    return updatedAdmin;
  }
  
  async getAllAdmins(): Promise<Admin[]> {
    return Array.from(this.admins.values());
  }

  // Leaderboard operations
  async getLeaderboard(period?: string): Promise<Array<{
    id: number;
    displayName: string;
    username: string;
    walletAddress: string | null;
    points: number;
    completedCourses: number;
    certificates: number;
  }>> {
    // Get all users
    const users = Array.from(this.users.values());
    const userCourses = Array.from(this.userCourses.values());
    const userCertificates = Array.from(this.certificates.values());
    const userRewards = Array.from(this.rewards.values());
    
    // Calculate points and stats for each user
    const leaderboardData = users.map(user => {
      // Get user's completed courses
      const completedCourses = userCourses.filter(uc => 
        uc.userId === user.id && 
        uc.completedAt !== null
      ).length;
      
      // Get user's certificates
      const certificates = userCertificates.filter(cert => 
        cert.userId === user.id
      ).length;
      
      // Calculate points (based on rewards, courses, certificates)
      // You can customize this formula based on your needs
      let points = 0;
      
      // Points from rewards
      userRewards.forEach(reward => {
        if (reward.userId === user.id) {
          // Convert TON to points (1 TON = 1000 points)
          points += reward.amount * 1000;
        }
      });
      
      // Points from completed courses
      points += completedCourses * 200;
      
      // Points from certificates
      points += certificates * 500;
      
      // Ensure points is an integer
      points = Math.round(points);
      
      return {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        walletAddress: user.walletAddress,
        points,
        completedCourses,
        certificates
      };
    });
    
    // Sort by points (descending)
    return leaderboardData.sort((a, b) => b.points - a.points);
  }
  
  // Seed data for testing
  private seedData() {
    // Sample data to initialize the app with

    // Create admin user
    const admin: InsertUser = {
      username: 'admin',
      password: 'adminpass', // Would be hashed in production
      telegramId: '12345',
      displayName: 'Admin User',
      isAdmin: true,
      referralCode: 'ADMIN123',
      walletAddress: '0x123456789abcdef'
    };
    this.createUser(admin);
    
    // Create test user
    const testUser: InsertUser = {
      username: 'alexjohnson',
      password: 'userpass', // Would be hashed in production
      telegramId: '67890',
      displayName: 'Alex Johnson',
      isAdmin: false,
      referralCode: 'ALEX123',
      walletAddress: '0xabcdef123456789',
      referredBy: null
    };
    this.createUser(testUser);
    
    // Update user with balance and referrals
    this.updateUser(2, {
      balance: 0.5,
      referralCount: 3
    });
    
    // Create a seed admin (for the admin dashboard)
    this.createAdmin({
      name: "Admin User",
      email: "admin@toneducation.com",
      password: "adminpass", // Would be hashed in production
      role: "superadmin"
    });
    
    // Create courses
    this.createCourse({
      title: 'TON Blockchain Basics',
      description: 'Learn the fundamentals of TON blockchain technology, including its architecture, consensus mechanism, and unique features. This course is perfect for beginners who want to understand how TON works.',
      level: 'Beginner',
      duration: '2 hours',
      thumbnail: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      minReward: 0.05,
      maxReward: 0.15
    });
    
    this.createCourse({
      title: 'Smart Contracts on TON',
      description: 'Develop and deploy smart contracts on TON',
      level: 'Intermediate',
      duration: '4 hours',
      thumbnail: 'https://images.unsplash.com/photo-1658259848978-b251a9246297?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      minReward: 0.1,
      maxReward: 0.2
    });
    
    this.createCourse({
      title: 'Intro to Web3',
      description: 'Understand the basics of Web3 technology',
      level: 'Beginner',
      duration: '1.5 hours',
      thumbnail: 'https://images.unsplash.com/photo-1639322537134-122c2d3eafa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      minReward: 0.02,
      maxReward: 0.05
    });

    // Create lessons for TON Blockchain Basics
    this.createLesson({
      courseId: 1,
      title: 'Introduction to TON',
      content: `
        <p>The Open Network (TON) is a fast, secure, and scalable blockchain designed to handle millions of transactions per second.</p>
        
        <p class="font-medium mt-4">Key Points:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Originally developed by Telegram</li>
          <li>Fully decentralized and open source</li>
          <li>Uses Proof-of-Stake consensus</li>
          <li>Supports smart contracts, dApps, and DeFi</li>
        </ul>
        
        <p class="font-medium mt-4">TON's Key Features:</p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Multi-blockchain architecture with dynamic sharding</li>
          <li>Fast finality and high throughput</li>
          <li>Low transaction fees</li>
          <li>Native integration with Telegram</li>
        </ul>
      `,
      duration: '10 min',
      orderNumber: 1
    });
    
    this.createLesson({
      courseId: 1,
      title: 'TON Architecture',
      content: 'Understanding the multi-blockchain architecture and sharding approach of TON.',
      duration: '15 min',
      orderNumber: 2
    });
    
    this.createLesson({
      courseId: 1,
      title: 'TON Coins & Wallets',
      content: 'Learn about TON coins, how to store them, and different wallet options.',
      duration: '20 min',
      orderNumber: 3
    });

    // Create user course progress
    this.createUserCourse({
      userId: 2,
      courseId: 1
    });
    
    this.createUserCourse({
      userId: 2,
      courseId: 3
    });

    // Update user course with progress
    const userCourses = Array.from(this.userCourses.values());
    if (userCourses.length > 0) {
      this.updateUserCourse(1, {
        progress: 33
      });
    }

    // Create certificates
    this.createCertificate({
      userId: 2,
      courseId: 1,
      name: 'Alex Johnson',
      courseTitle: 'TON Blockchain Basics',
      issuedDate: '2023-03-15', // String format for the date
      tokenId: '1023',
      txHash: '0x123456789abcdef'
    });
    
    this.createCertificate({
      userId: 2,
      courseId: 3,
      name: 'Alex Johnson',
      courseTitle: 'Intro to Web3',
      issuedDate: '2023-04-02', // String format for the date
      tokenId: '1045',
      txHash: '0xfedcba987654321'
    });

    // Create rewards
    this.createReward({
      userId: 2,
      amount: 0.15,
      reason: 'Course Completion',
      courseId: 1,
      txHash: '0x123456789abcdef'
    });
    
    this.createReward({
      userId: 2,
      amount: 0.05,
      reason: 'Course Completion',
      courseId: 3,
      txHash: '0xfedcba987654321'
    });
    
    this.createReward({
      userId: 2,
      amount: 0.3,
      reason: 'Referral Bonus',
      courseId: null,
      txHash: '0xaabbccddeeff'
    });
    
    // Create referral tiers
    this.createReferralTier({
      tier: 0,
      name: 'Base',
      requiredReferrals: 0,
      rewardMultiplier: 1.0,
      color: '#64748b', // Slate
      icon: 'user'
    });
    
    this.createReferralTier({
      tier: 1,
      name: 'Bronze',
      requiredReferrals: 3,
      rewardMultiplier: 1.2,
      color: '#b45309', // Amber
      icon: 'award'
    });
    
    this.createReferralTier({
      tier: 2,
      name: 'Silver',
      requiredReferrals: 10,
      rewardMultiplier: 1.5,
      color: '#94a3b8', // Silver
      icon: 'award'
    });
    
    this.createReferralTier({
      tier: 3,
      name: 'Gold',
      requiredReferrals: 25,
      rewardMultiplier: 2.0,
      color: '#eab308', // Yellow/Gold
      icon: 'trophy'
    });
    
    // Update user tiers based on referral count
    const users = Array.from(this.users.values());
    for (const user of users) {
      this.updateUserReferralTier(user.id);
    }
  }
}

import { db } from "./db";
import { eq, and, desc, sql, count, isNull, isNotNull, asc } from "drizzle-orm";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL
      },
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      balance: 0,
      referralCount: 0,
      referralTier: 0,
      isAdmin: user.isAdmin || false,
      walletAddress: user.walletAddress || null,
      referredBy: user.referredBy || null
    }).returning();
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    try {
      // Try to fetch with all fields
      const [course] = await db.select().from(courses).where(eq(courses.id, id));
      return course;
    } catch (error) {
      console.log("Error fetching course with full schema, trying basic schema:", error);
      
      // Fall back to basic fields if skills and category columns are missing
      try {
        const query = `SELECT 
            id, title, description, level, duration, thumbnail, min_reward, max_reward, created_at, active
           FROM courses 
           WHERE id = ${id}`;
        const result = await db.execute(query);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        const row = result.rows[0];
        
        // Map to our course schema with default values for new fields
        return {
          id: Number(row.id),
          title: String(row.title),
          description: String(row.description),
          level: String(row.level),
          duration: String(row.duration),
          thumbnail: String(row.thumbnail),
          minReward: Number(row.min_reward),
          maxReward: Number(row.max_reward),
          createdAt: new Date(String(row.created_at)),
          active: Boolean(row.active),
          // Default values for new fields
          skills: null,
          category: null
        };
      } catch (fallbackError) {
        console.error("Failed to retrieve course with basic schema:", fallbackError);
        return undefined;
      }
    }
  }
  
  async getAllCourses(activeOnly: boolean = true): Promise<Course[]> {
    try {
      // Try to fetch with all fields
      if (activeOnly) {
        return await db.select().from(courses).where(eq(courses.active, true));
      } else {
        return await db.select().from(courses);
      }
    } catch (error) {
      console.log("Error fetching courses with full schema, trying basic schema:", error);
      
      // If error mentions missing columns, fall back to basic fields only
      try {
        let query = `
          SELECT 
            id, title, description, level, duration, thumbnail, min_reward, max_reward, created_at, active
           FROM courses
        `;
        
        if (activeOnly) {
          query += ` WHERE active = true`;
        }
        
        const result = await db.execute(query);
        
        // Map the basic data to our course schema with default values for new fields
        return result.rows.map(row => ({
          id: Number(row.id),
          title: String(row.title),
          description: String(row.description),
          level: String(row.level),
          duration: String(row.duration),
          thumbnail: String(row.thumbnail),
          minReward: Number(row.min_reward),
          maxReward: Number(row.max_reward),
          createdAt: new Date(String(row.created_at)),
          active: Boolean(row.active),
          // Default values for new fields
          skills: null,
          category: null
        }));
      } catch (fallbackError) {
        console.error("Failed to retrieve courses with basic schema:", fallbackError);
        throw fallbackError;
      }
    }
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values({
      ...course,
      active: true,
      skills: course.skills || null,
      category: course.category || null
    }).returning();
    return newCourse;
  }
  
  async updateCourse(id: number, courseData: Partial<Course>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    try {
      await db.delete(courses).where(eq(courses.id, id));
      return true;
    } catch (error) {
      console.error("Delete course error:", error);
      return false;
    }
  }
  
  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }
  
  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return await db.select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.orderNumber));
  }
  
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }
  
  async updateLesson(id: number, lessonData: Partial<Lesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db.update(lessons)
      .set(lessonData)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }
  
  async deleteLesson(id: number): Promise<boolean> {
    try {
      await db.delete(lessons).where(eq(lessons.id, id));
      return true;
    } catch (error) {
      console.error("Delete lesson error:", error);
      return false;
    }
  }
  
  // UserCourse operations
  async getUserCourse(userId: number, courseId: number): Promise<UserCourse | undefined> {
    const [userCourse] = await db.select()
      .from(userCourses)
      .where(and(
        eq(userCourses.userId, userId),
        eq(userCourses.courseId, courseId)
      ));
    return userCourse;
  }
  
  async getUserCourses(userId: number): Promise<UserCourse[]> {
    return await db.select()
      .from(userCourses)
      .where(eq(userCourses.userId, userId));
  }
  
  async createUserCourse(userCourse: InsertUserCourse): Promise<UserCourse> {
    const [newUserCourse] = await db.insert(userCourses).values({
      ...userCourse,
      progress: 0,
      rewardClaimed: false,
      rewardAmount: null
    }).returning();
    return newUserCourse;
  }
  
  async updateUserCourse(id: number, userCourseData: Partial<UserCourse>): Promise<UserCourse | undefined> {
    const [updatedUserCourse] = await db.update(userCourses)
      .set(userCourseData)
      .where(eq(userCourses.id, id))
      .returning();
    return updatedUserCourse;
  }
  
  async getAllUserCourses(): Promise<UserCourse[]> {
    return await db.select().from(userCourses);
  }
  
  // UserLesson operations
  async getUserLesson(userId: number, lessonId: number): Promise<UserLesson | undefined> {
    const [userLesson] = await db.select()
      .from(userLessons)
      .where(and(
        eq(userLessons.userId, userId),
        eq(userLessons.lessonId, lessonId)
      ));
    return userLesson;
  }
  
  async getUserLessonsByCourse(userId: number, courseId: number): Promise<UserLesson[]> {
    return await db.select()
      .from(userLessons)
      .where(and(
        eq(userLessons.userId, userId),
        eq(userLessons.courseId, courseId)
      ));
  }
  
  async createUserLesson(userLesson: InsertUserLesson): Promise<UserLesson> {
    const [newUserLesson] = await db.insert(userLessons).values({
      ...userLesson,
      completed: false,
      completedAt: null
    }).returning();
    return newUserLesson;
  }
  
  async updateUserLesson(id: number, userLessonData: Partial<UserLesson>): Promise<UserLesson | undefined> {
    const [updatedUserLesson] = await db.update(userLessons)
      .set(userLessonData)
      .where(eq(userLessons.id, id))
      .returning();
    return updatedUserLesson;
  }
  
  // Certificate operations
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    try {
      // Try to fetch with all fields
      return await db.select()
        .from(certificates)
        .where(eq(certificates.userId, userId));
    } catch (error) {
      console.log("Error fetching certificates with full schema, trying basic schema:", error);
      
      // If error mentions missing columns, fall back to basic fields only
      // This is a backward compatibility solution until a proper DB migration is done
      try {
        // Prepare string-based query without parameters
        const query = `SELECT 
            id, user_id, course_id, name, course_title, issued_date, token_id, tx_hash 
           FROM certificates 
           WHERE user_id = ${userId}`;
        const result = await db.execute(query);
        
        // Map the basic data to our certificate schema with default values for new fields
        return result.rows.map(row => ({
          id: Number(row.id),
          userId: Number(row.user_id),
          courseId: Number(row.course_id),
          name: String(row.name),
          courseTitle: String(row.course_title),
          issuedDate: String(row.issued_date),
          tokenId: row.token_id ? String(row.token_id) : null,
          txHash: row.tx_hash ? String(row.tx_hash) : null,
          // Default values for new fields
          templateId: 'default',
          badgeUrl: null,
          description: null,
          skills: null,
          issuer: 'TON EDUCATION',
          certificateType: 'completion',
          backgroundColor: '#f8fafc',
          borderColor: '#0ea5e9',
          validUntil: null,
          metadataJson: null
        }));
      } catch (fallbackError) {
        console.error("Failed to retrieve certificates with basic schema:", fallbackError);
        throw fallbackError;
      }
    }
  }
  
  async getCertificate(id: number): Promise<Certificate | undefined> {
    try {
      // Try to fetch with all fields
      const [certificate] = await db.select().from(certificates).where(eq(certificates.id, id));
      return certificate;
    } catch (error) {
      console.log("Error fetching certificate with full schema, trying basic schema:", error);
      
      // Fall back to basic fields only if columns are missing
      try {
        const query = `SELECT 
            id, user_id, course_id, name, course_title, issued_date, token_id, tx_hash 
           FROM certificates 
           WHERE id = ${id}`;
        const result = await db.execute(query);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        const row = result.rows[0];
        
        // Map the basic data to our certificate schema with default values for new fields
        return {
          id: Number(row.id),
          userId: Number(row.user_id),
          courseId: Number(row.course_id),
          name: String(row.name),
          courseTitle: String(row.course_title),
          issuedDate: String(row.issued_date),
          tokenId: row.token_id ? String(row.token_id) : null,
          txHash: row.tx_hash ? String(row.tx_hash) : null,
          // Default values for new fields
          templateId: 'default',
          badgeUrl: null,
          description: null,
          skills: null,
          issuer: 'TON EDUCATION',
          certificateType: 'completion',
          backgroundColor: '#f8fafc',
          borderColor: '#0ea5e9',
          validUntil: null,
          metadataJson: null
        };
      } catch (fallbackError) {
        console.error("Failed to retrieve certificate with basic schema:", fallbackError);
        return undefined;
      }
    }
  }
  
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values({
      ...certificate,
      tokenId: certificate.tokenId || null,
      txHash: certificate.txHash || null,
      description: certificate.description || null,
      skills: certificate.skills || null,
      badgeUrl: certificate.badgeUrl || null,
      metadataJson: certificate.metadataJson || null
    }).returning();
    return newCertificate;
  }
  
  async getAllCertificates(): Promise<Certificate[]> {
    return await db.select().from(certificates);
  }
  
  // Reward operations
  async getUserRewards(userId: number): Promise<Reward[]> {
    return await db.select()
      .from(rewards)
      .where(eq(rewards.userId, userId));
  }
  
  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values({
      ...reward,
      courseId: reward.courseId || null,
      txHash: reward.txHash || null
    }).returning();
    return newReward;
  }
  
  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }
  
  // Referral Tier operations
  async getReferralTier(tier: number): Promise<ReferralTier | undefined> {
    const [referralTier] = await db.select()
      .from(referralTiers)
      .where(eq(referralTiers.tier, tier));
    return referralTier;
  }
  
  async getAllReferralTiers(): Promise<ReferralTier[]> {
    return await db.select()
      .from(referralTiers)
      .orderBy(asc(referralTiers.tier));
  }
  
  async createReferralTier(tier: InsertReferralTier): Promise<ReferralTier> {
    const [newTier] = await db.insert(referralTiers).values({
      ...tier,
      icon: tier.icon || null
    }).returning();
    return newTier;
  }
  
  async updateReferralTier(id: number, tierData: Partial<ReferralTier>): Promise<ReferralTier | undefined> {
    const [updatedTier] = await db.update(referralTiers)
      .set(tierData)
      .where(eq(referralTiers.id, id))
      .returning();
    return updatedTier;
  }
  
  // User Referral operations
  async updateUserReferralTier(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const tiers = await this.getAllReferralTiers();
    if (tiers.length === 0) return user;
    
    // Sort tiers by required referrals (descending)
    const sortedTiers = [...tiers].sort((a, b) => b.requiredReferrals - a.requiredReferrals);
    
    // Find the highest tier the user qualifies for
    let newTier = 0; // Default to base tier
    for (const tier of sortedTiers) {
      if (user.referralCount >= tier.requiredReferrals) {
        newTier = tier.tier;
        break;
      }
    }
    
    // Update user's tier if it has changed
    if (user.referralTier !== newTier) {
      return this.updateUser(userId, { referralTier: newTier });
    }
    
    return user;
  }
  
  async getReferralRewardAmount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0.05; // Default reward amount
    
    const userTier = await this.getReferralTier(user.referralTier);
    if (!userTier) return 0.05; // Default if tier not found
    
    // Base reward * tier multiplier
    return 0.05 * userTier.rewardMultiplier;
  }
  
  // Leaderboard operations
  async getLeaderboard(period?: string): Promise<Array<{
    id: number;
    displayName: string;
    username: string;
    walletAddress: string | null;
    points: number;
    completedCourses: number;
    certificates: number;
  }>> {
    // Get all users with their stats
    const userData = await db.select({
      id: users.id,
      displayName: users.displayName,
      username: users.username,
      walletAddress: users.walletAddress,
      // This will need to be a more complex query in a real application
      // For now, we'll just count all courses and certificates and adjust in-memory
      completedCourses: sql<number>`count(distinct CASE WHEN ${userCourses.completedAt} IS NOT NULL THEN ${userCourses.id} ELSE NULL END)`,
      certificates: sql<number>`count(distinct ${certificates.id})`
    })
    .from(users)
    .leftJoin(userCourses, eq(users.id, userCourses.userId))
    .leftJoin(certificates, eq(users.id, certificates.userId))
    .groupBy(users.id);
    
    // Get rewards for each user
    const rewardsData = await db.select({
      userId: rewards.userId,
      totalReward: sql<number>`sum(${rewards.amount})`
    })
    .from(rewards)
    .groupBy(rewards.userId);
    
    // Map the reward data to a dictionary for faster lookup
    const rewardsByUser = rewardsData.reduce((acc, reward) => {
      acc[reward.userId] = reward.totalReward || 0;
      return acc;
    }, {} as Record<number, number>);
    
    // Calculate points for each user
    const leaderboard = userData.map(user => {
      const rewardPoints = (rewardsByUser[user.id] || 0) * 1000; // 1 TON = 1000 points
      const coursePoints = user.completedCourses * 200;
      const certificatePoints = user.certificates * 500;
      
      // Total points
      const points = Math.round(rewardPoints + coursePoints + certificatePoints);
      
      return {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        walletAddress: user.walletAddress,
        points,
        completedCourses: Number(user.completedCourses) || 0,
        certificates: Number(user.certificates) || 0
      };
    });
    
    // Sort by points (descending)
    return leaderboard.sort((a, b) => b.points - a.points);
  }
  
  // Admin operations
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin;
  }
  
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values({
      ...admin,
      role: admin.role || "admin" // Ensure role is never undefined
    }).returning();
    return newAdmin;
  }
  
  async updateAdmin(id: number, adminData: Partial<Admin>): Promise<Admin | undefined> {
    const [updatedAdmin] = await db.update(admins)
      .set(adminData)
      .where(eq(admins.id, id))
      .returning();
    return updatedAdmin;
  }
  
  async updateAdminLastLogin(id: number): Promise<Admin | undefined> {
    const [updatedAdmin] = await db.update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, id))
      .returning();
    return updatedAdmin;
  }
  
  async getAllAdmins(): Promise<Admin[]> {
    return await db.select().from(admins);
  }
}

// Create and export a storage instance
// For development or testing, use MemStorage
// For production, use DatabaseStorage
export const storage = new DatabaseStorage();
