import { 
  users, User, InsertUser,
  courses, Course, InsertCourse,
  lessons, Lesson, InsertLesson,
  userCourses, UserCourse, InsertUserCourse,
  userLessons, UserLesson, InsertUserLesson,
  certificates, Certificate, InsertCertificate,
  rewards, Reward, InsertReward 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
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
  
  // UserLesson operations
  getUserLesson(userId: number, lessonId: number): Promise<UserLesson | undefined>;
  getUserLessonsByCourse(userId: number, courseId: number): Promise<UserLesson[]>;
  createUserLesson(userLesson: InsertUserLesson): Promise<UserLesson>;
  updateUserLesson(id: number, userLesson: Partial<UserLesson>): Promise<UserLesson | undefined>;
  
  // Certificate operations
  getUserCertificates(userId: number): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  // Reward operations
  getUserRewards(userId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private lessons: Map<number, Lesson>;
  private userCourses: Map<number, UserCourse>;
  private userLessons: Map<number, UserLesson>;
  private certificates: Map<number, Certificate>;
  private rewards: Map<number, Reward>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private lessonIdCounter: number;
  private userCourseIdCounter: number;
  private userLessonIdCounter: number;
  private certificateIdCounter: number;
  private rewardIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.lessons = new Map();
    this.userCourses = new Map();
    this.userLessons = new Map();
    this.certificates = new Map();
    this.rewards = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.lessonIdCounter = 1;
    this.userCourseIdCounter = 1;
    this.userLessonIdCounter = 1;
    this.certificateIdCounter = 1;
    this.rewardIdCounter = 1;
    
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
    const newUser = { ...user, id, createdAt: new Date(), balance: 0, referralCount: 0 };
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
    const newCertificate = { ...certificate, id };
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
    const newReward = { ...reward, id, createdAt: new Date() };
    this.rewards.set(id, newReward);
    return newReward;
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
      issuedDate: new Date('2023-03-15'),
      tokenId: '1023',
      txHash: '0x123456789abcdef'
    });
    
    this.createCertificate({
      userId: 2,
      courseId: 3,
      name: 'Alex Johnson',
      courseTitle: 'Intro to Web3',
      issuedDate: new Date('2023-04-02'),
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
  }
}

export const storage = new MemStorage();
