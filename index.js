// server/index.ts
import express3 from "express";

// server/routes.ts
import express, { Router } from "express";
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  courses;
  lessons;
  userCourses;
  userLessons;
  certificates;
  rewards;
  userIdCounter;
  courseIdCounter;
  lessonIdCounter;
  userCourseIdCounter;
  userLessonIdCounter;
  certificateIdCounter;
  rewardIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.courses = /* @__PURE__ */ new Map();
    this.lessons = /* @__PURE__ */ new Map();
    this.userCourses = /* @__PURE__ */ new Map();
    this.userLessons = /* @__PURE__ */ new Map();
    this.certificates = /* @__PURE__ */ new Map();
    this.rewards = /* @__PURE__ */ new Map();
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
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }
  async getUserByTelegramId(telegramId) {
    return Array.from(this.users.values()).find((user) => user.telegramId === telegramId);
  }
  async createUser(user) {
    const id = this.userIdCounter++;
    const newUser = { ...user, id, createdAt: /* @__PURE__ */ new Date(), balance: 0, referralCount: 0 };
    this.users.set(id, newUser);
    return newUser;
  }
  async updateUser(id, userData) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Course operations
  async getCourse(id) {
    return this.courses.get(id);
  }
  async getAllCourses(activeOnly = true) {
    const allCourses = Array.from(this.courses.values());
    return activeOnly ? allCourses.filter((course) => course.active) : allCourses;
  }
  async createCourse(course) {
    const id = this.courseIdCounter++;
    const newCourse = { ...course, id, createdAt: /* @__PURE__ */ new Date(), active: true };
    this.courses.set(id, newCourse);
    return newCourse;
  }
  async updateCourse(id, courseData) {
    const course = this.courses.get(id);
    if (!course) return void 0;
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  async deleteCourse(id) {
    return this.courses.delete(id);
  }
  // Lesson operations
  async getLesson(id) {
    return this.lessons.get(id);
  }
  async getLessonsByCourse(courseId) {
    return Array.from(this.lessons.values()).filter((lesson) => lesson.courseId === courseId).sort((a, b) => a.orderNumber - b.orderNumber);
  }
  async createLesson(lesson) {
    const id = this.lessonIdCounter++;
    const newLesson = { ...lesson, id, createdAt: /* @__PURE__ */ new Date() };
    this.lessons.set(id, newLesson);
    return newLesson;
  }
  async updateLesson(id, lessonData) {
    const lesson = this.lessons.get(id);
    if (!lesson) return void 0;
    const updatedLesson = { ...lesson, ...lessonData };
    this.lessons.set(id, updatedLesson);
    return updatedLesson;
  }
  async deleteLesson(id) {
    return this.lessons.delete(id);
  }
  // UserCourse operations
  async getUserCourse(userId, courseId) {
    return Array.from(this.userCourses.values()).find((uc) => uc.userId === userId && uc.courseId === courseId);
  }
  async getUserCourses(userId) {
    return Array.from(this.userCourses.values()).filter((uc) => uc.userId === userId);
  }
  async createUserCourse(userCourse) {
    const id = this.userCourseIdCounter++;
    const newUserCourse = {
      ...userCourse,
      id,
      progress: 0,
      startedAt: /* @__PURE__ */ new Date(),
      completedAt: null,
      rewardClaimed: false,
      rewardAmount: null
    };
    this.userCourses.set(id, newUserCourse);
    return newUserCourse;
  }
  async updateUserCourse(id, userCourseData) {
    const userCourse = this.userCourses.get(id);
    if (!userCourse) return void 0;
    const updatedUserCourse = { ...userCourse, ...userCourseData };
    this.userCourses.set(id, updatedUserCourse);
    return updatedUserCourse;
  }
  // UserLesson operations
  async getUserLesson(userId, lessonId) {
    return Array.from(this.userLessons.values()).find((ul) => ul.userId === userId && ul.lessonId === lessonId);
  }
  async getUserLessonsByCourse(userId, courseId) {
    return Array.from(this.userLessons.values()).filter((ul) => ul.userId === userId && ul.courseId === courseId);
  }
  async createUserLesson(userLesson) {
    const id = this.userLessonIdCounter++;
    const newUserLesson = { ...userLesson, id, completed: false, completedAt: null };
    this.userLessons.set(id, newUserLesson);
    return newUserLesson;
  }
  async updateUserLesson(id, userLessonData) {
    const userLesson = this.userLessons.get(id);
    if (!userLesson) return void 0;
    const updatedUserLesson = { ...userLesson, ...userLessonData };
    this.userLessons.set(id, updatedUserLesson);
    return updatedUserLesson;
  }
  // Certificate operations
  async getUserCertificates(userId) {
    return Array.from(this.certificates.values()).filter((cert) => cert.userId === userId);
  }
  async getCertificate(id) {
    return this.certificates.get(id);
  }
  async createCertificate(certificate) {
    const id = this.certificateIdCounter++;
    const newCertificate = { ...certificate, id };
    this.certificates.set(id, newCertificate);
    return newCertificate;
  }
  // Reward operations
  async getUserRewards(userId) {
    return Array.from(this.rewards.values()).filter((reward) => reward.userId === userId);
  }
  async createReward(reward) {
    const id = this.rewardIdCounter++;
    const newReward = { ...reward, id, createdAt: /* @__PURE__ */ new Date() };
    this.rewards.set(id, newReward);
    return newReward;
  }
  // Get all users
  async getAllUsers() {
    return Array.from(this.users.values());
  }
  // Leaderboard operations
  async getLeaderboard(period) {
    const users2 = Array.from(this.users.values());
    const userCourses2 = Array.from(this.userCourses.values());
    const userCertificates = Array.from(this.certificates.values());
    const userRewards = Array.from(this.rewards.values());
    const leaderboardData = users2.map((user) => {
      const completedCourses = userCourses2.filter(
        (uc) => uc.userId === user.id && uc.completedAt !== null
      ).length;
      const certificates2 = userCertificates.filter(
        (cert) => cert.userId === user.id
      ).length;
      let points = 0;
      userRewards.forEach((reward) => {
        if (reward.userId === user.id) {
          points += reward.amount * 1e3;
        }
      });
      points += completedCourses * 200;
      points += certificates2 * 500;
      points = Math.round(points);
      return {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        walletAddress: user.walletAddress,
        points,
        completedCourses,
        certificates: certificates2
      };
    });
    return leaderboardData.sort((a, b) => b.points - a.points);
  }
  // Seed data for testing
  seedData() {
    const admin = {
      username: "admin",
      password: "adminpass",
      // Would be hashed in production
      telegramId: "12345",
      displayName: "Admin User",
      isAdmin: true,
      referralCode: "ADMIN123",
      walletAddress: "0x123456789abcdef"
    };
    this.createUser(admin);
    const testUser = {
      username: "alexjohnson",
      password: "userpass",
      // Would be hashed in production
      telegramId: "67890",
      displayName: "Alex Johnson",
      isAdmin: false,
      referralCode: "ALEX123",
      walletAddress: "0xabcdef123456789",
      referredBy: null
    };
    this.createUser(testUser);
    this.updateUser(2, {
      balance: 0.5,
      referralCount: 3
    });
    this.createCourse({
      title: "TON Blockchain Basics",
      description: "Learn the fundamentals of TON blockchain technology, including its architecture, consensus mechanism, and unique features. This course is perfect for beginners who want to understand how TON works.",
      level: "Beginner",
      duration: "2 hours",
      thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      minReward: 0.05,
      maxReward: 0.15
    });
    this.createCourse({
      title: "Smart Contracts on TON",
      description: "Develop and deploy smart contracts on TON",
      level: "Intermediate",
      duration: "4 hours",
      thumbnail: "https://images.unsplash.com/photo-1658259848978-b251a9246297?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      minReward: 0.1,
      maxReward: 0.2
    });
    this.createCourse({
      title: "Intro to Web3",
      description: "Understand the basics of Web3 technology",
      level: "Beginner",
      duration: "1.5 hours",
      thumbnail: "https://images.unsplash.com/photo-1639322537134-122c2d3eafa8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
      minReward: 0.02,
      maxReward: 0.05
    });
    this.createLesson({
      courseId: 1,
      title: "Introduction to TON",
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
      duration: "10 min",
      orderNumber: 1
    });
    this.createLesson({
      courseId: 1,
      title: "TON Architecture",
      content: "Understanding the multi-blockchain architecture and sharding approach of TON.",
      duration: "15 min",
      orderNumber: 2
    });
    this.createLesson({
      courseId: 1,
      title: "TON Coins & Wallets",
      content: "Learn about TON coins, how to store them, and different wallet options.",
      duration: "20 min",
      orderNumber: 3
    });
    this.createUserCourse({
      userId: 2,
      courseId: 1
    });
    this.createUserCourse({
      userId: 2,
      courseId: 3
    });
    const userCourses2 = Array.from(this.userCourses.values());
    if (userCourses2.length > 0) {
      this.updateUserCourse(1, {
        progress: 33
      });
    }
    this.createCertificate({
      userId: 2,
      courseId: 1,
      name: "Alex Johnson",
      courseTitle: "TON Blockchain Basics",
      issuedDate: /* @__PURE__ */ new Date("2023-03-15"),
      tokenId: "1023",
      txHash: "0x123456789abcdef"
    });
    this.createCertificate({
      userId: 2,
      courseId: 3,
      name: "Alex Johnson",
      courseTitle: "Intro to Web3",
      issuedDate: /* @__PURE__ */ new Date("2023-04-02"),
      tokenId: "1045",
      txHash: "0xfedcba987654321"
    });
    this.createReward({
      userId: 2,
      amount: 0.15,
      reason: "Course Completion",
      courseId: 1,
      txHash: "0x123456789abcdef"
    });
    this.createReward({
      userId: 2,
      amount: 0.05,
      reason: "Course Completion",
      courseId: 3,
      txHash: "0xfedcba987654321"
    });
    this.createReward({
      userId: 2,
      amount: 0.3,
      reason: "Referral Bonus",
      courseId: null,
      txHash: "0xaabbccddeeff"
    });
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, boolean, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramId: text("telegram_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  walletAddress: text("wallet_address"),
  balance: real("balance").default(0).notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  referralCount: integer("referral_count").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, balance: true, referralCount: true });
var courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  duration: text("duration").notNull(),
  thumbnail: text("thumbnail").notNull(),
  minReward: real("min_reward").notNull(),
  maxReward: real("max_reward").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull()
});
var insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true, active: true });
var lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  duration: text("duration").notNull(),
  orderNumber: integer("order_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
var userCourses = pgTable("user_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false).notNull(),
  rewardAmount: real("reward_amount")
});
var insertUserCourseSchema = createInsertSchema(userCourses).omit({ id: true, progress: true, startedAt: true, completedAt: true, rewardClaimed: true, rewardAmount: true });
var userLessons = pgTable("user_lessons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at")
});
var insertUserLessonSchema = createInsertSchema(userLessons).omit({ id: true, completed: true, completedAt: true });
var certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  name: text("name").notNull(),
  courseTitle: text("course_title").notNull(),
  issuedDate: date("issued_date").notNull(),
  tokenId: text("token_id"),
  txHash: text("tx_hash")
});
var insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });
var rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  courseId: integer("course_id"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertRewardSchema = createInsertSchema(rewards).omit({ id: true, createdAt: true });

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  const httpServer = createServer(app2);
  const apiRouter = Router();
  apiRouter.use(express.json());
  const handleErrors = (err, req, res, next) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ error: validationError.message });
    }
    next(err);
  };
  apiRouter.use(handleErrors);
  apiRouter.post("/api/auth/telegram", async (req, res) => {
    try {
      const { telegramId, displayName, username } = req.body;
      if (!telegramId || !displayName || !username) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        const referralCode = "REF" + Math.random().toString(36).substring(2, 10).toUpperCase();
        user = await storage.createUser({
          telegramId,
          displayName,
          username,
          password: "",
          // Not using password for Telegram auth
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
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });
  apiRouter.get("/api/users/me", async (req, res) => {
    try {
      const user = await storage.getUser(2);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
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
      console.error("Get user error:", error);
      return res.status(500).json({ error: "Failed to get user" });
    }
  });
  apiRouter.patch("/api/users/wallet", async (req, res) => {
    try {
      const { userId, walletAddress } = req.body;
      if (!userId || !walletAddress) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(userId, { walletAddress });
      return res.json({
        success: true,
        walletAddress: updatedUser?.walletAddress
      });
    } catch (error) {
      console.error("Update wallet error:", error);
      return res.status(500).json({ error: "Failed to update wallet" });
    }
  });
  apiRouter.get("/api/courses", async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly !== "false";
      const courses2 = await storage.getAllCourses(activeOnly);
      return res.json(courses2);
    } catch (error) {
      console.error("Get courses error:", error);
      return res.status(500).json({ error: "Failed to get courses" });
    }
  });
  apiRouter.get("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const lessons2 = await storage.getLessonsByCourse(courseId);
      return res.json({
        ...course,
        lessons: lessons2
      });
    } catch (error) {
      console.error("Get course error:", error);
      return res.status(500).json({ error: "Failed to get course" });
    }
  });
  apiRouter.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      return res.status(201).json(course);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Create course error:", error);
      return res.status(500).json({ error: "Failed to create course" });
    }
  });
  apiRouter.patch("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      return res.json(updatedCourse);
    } catch (error) {
      console.error("Update course error:", error);
      return res.status(500).json({ error: "Failed to update course" });
    }
  });
  apiRouter.delete("/api/courses/:id", async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      const result = await storage.deleteCourse(courseId);
      if (!result) {
        return res.status(404).json({ error: "Course not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete course error:", error);
      return res.status(500).json({ error: "Failed to delete course" });
    }
  });
  apiRouter.get("/api/courses/:courseId/lessons", async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid course ID" });
      }
      const lessons2 = await storage.getLessonsByCourse(courseId);
      return res.json(lessons2);
    } catch (error) {
      console.error("Get lessons error:", error);
      return res.status(500).json({ error: "Failed to get lessons" });
    }
  });
  apiRouter.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      return res.json(lesson);
    } catch (error) {
      console.error("Get lesson error:", error);
      return res.status(500).json({ error: "Failed to get lesson" });
    }
  });
  apiRouter.post("/api/lessons", async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      return res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      console.error("Create lesson error:", error);
      return res.status(500).json({ error: "Failed to create lesson" });
    }
  });
  apiRouter.patch("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const updatedLesson = await storage.updateLesson(lessonId, req.body);
      return res.json(updatedLesson);
    } catch (error) {
      console.error("Update lesson error:", error);
      return res.status(500).json({ error: "Failed to update lesson" });
    }
  });
  apiRouter.delete("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }
      const result = await storage.deleteLesson(lessonId);
      if (!result) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete lesson error:", error);
      return res.status(500).json({ error: "Failed to delete lesson" });
    }
  });
  apiRouter.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const userCourses2 = await storage.getUserCourses(userId);
      return res.json(userCourses2);
    } catch (error) {
      console.error("Get user progress error:", error);
      return res.status(500).json({ error: "Failed to get user progress" });
    }
  });
  apiRouter.post("/api/users/:userId/courses/:courseId/start", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid user ID or course ID" });
      }
      let userCourse = await storage.getUserCourse(userId, courseId);
      if (!userCourse) {
        userCourse = await storage.createUserCourse({
          userId,
          courseId
        });
      }
      return res.json(userCourse);
    } catch (error) {
      console.error("Start course error:", error);
      return res.status(500).json({ error: "Failed to start course" });
    }
  });
  apiRouter.post("/api/users/:userId/lessons/:lessonId/complete", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const lessonId = parseInt(req.params.lessonId);
      if (isNaN(userId) || isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid user ID or lesson ID" });
      }
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      let userLesson = await storage.getUserLesson(userId, lessonId);
      if (!userLesson) {
        userLesson = await storage.createUserLesson({
          userId,
          lessonId,
          courseId: lesson.courseId
        });
      }
      userLesson = await storage.updateUserLesson(userLesson.id, {
        completed: true,
        completedAt: /* @__PURE__ */ new Date()
      });
      const courseLessons = await storage.getLessonsByCourse(lesson.courseId);
      const userLessons2 = await storage.getUserLessonsByCourse(userId, lesson.courseId);
      const completedLessons = userLessons2.filter((ul) => ul.completed);
      const progress = Math.round(completedLessons.length / courseLessons.length * 100);
      let userCourse = await storage.getUserCourse(userId, lesson.courseId);
      if (!userCourse) {
        userCourse = await storage.createUserCourse({
          userId,
          courseId: lesson.courseId
        });
      }
      userCourse = await storage.updateUserCourse(userCourse.id, { progress });
      if (progress === 100 && !userCourse.completedAt) {
        userCourse = await storage.updateUserCourse(userCourse.id, {
          completedAt: /* @__PURE__ */ new Date()
        });
      }
      return res.json({
        userLesson,
        progress,
        courseCompleted: progress === 100
      });
    } catch (error) {
      console.error("Complete lesson error:", error);
      return res.status(500).json({ error: "Failed to complete lesson" });
    }
  });
  apiRouter.get("/api/users/:userId/certificates", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const certificates2 = await storage.getUserCertificates(userId);
      return res.json(certificates2);
    } catch (error) {
      console.error("Get certificates error:", error);
      return res.status(500).json({ error: "Failed to get certificates" });
    }
  });
  apiRouter.get("/api/certificates/:id", async (req, res) => {
    try {
      const certificateId = parseInt(req.params.id);
      if (isNaN(certificateId)) {
        return res.status(400).json({ error: "Invalid certificate ID" });
      }
      const certificate = await storage.getCertificate(certificateId);
      if (!certificate) {
        return res.status(404).json({ error: "Certificate not found" });
      }
      return res.json(certificate);
    } catch (error) {
      console.error("Get certificate error:", error);
      return res.status(500).json({ error: "Failed to get certificate" });
    }
  });
  apiRouter.post("/api/users/:userId/courses/:courseId/certificate", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid user ID or course ID" });
      }
      const user = await storage.getUser(userId);
      const course = await storage.getCourse(courseId);
      if (!user || !course) {
        return res.status(404).json({ error: "User or course not found" });
      }
      const userCourse = await storage.getUserCourse(userId, courseId);
      if (!userCourse || !userCourse.completedAt) {
        return res.status(400).json({ error: "Course not completed" });
      }
      const existingCertificates = await storage.getUserCertificates(userId);
      const hasCertificate = existingCertificates.some((cert) => cert.courseId === courseId);
      if (hasCertificate) {
        return res.status(400).json({ error: "Certificate already issued" });
      }
      const tokenId = Math.floor(1e3 + Math.random() * 9e3).toString();
      const certificate = await storage.createCertificate({
        userId,
        courseId,
        name: user.displayName,
        courseTitle: course.title,
        issuedDate: /* @__PURE__ */ new Date(),
        tokenId,
        txHash: "0x" + Math.random().toString(16).substring(2, 14)
      });
      return res.status(201).json(certificate);
    } catch (error) {
      console.error("Create certificate error:", error);
      return res.status(500).json({ error: "Failed to create certificate" });
    }
  });
  apiRouter.get("/api/users/:userId/rewards", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const rewards2 = await storage.getUserRewards(userId);
      return res.json(rewards2);
    } catch (error) {
      console.error("Get rewards error:", error);
      return res.status(500).json({ error: "Failed to get rewards" });
    }
  });
  apiRouter.get("/api/leaderboard", async (req, res) => {
    try {
      const period = req.query.period;
      const leaderboard = await storage.getLeaderboard(period);
      return res.json(leaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      return res.status(500).json({ error: "Failed to get leaderboard data" });
    }
  });
  apiRouter.post("/api/users/:userId/courses/:courseId/reward", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const courseId = parseInt(req.params.courseId);
      if (isNaN(userId) || isNaN(courseId)) {
        return res.status(400).json({ error: "Invalid user ID or course ID" });
      }
      const user = await storage.getUser(userId);
      const course = await storage.getCourse(courseId);
      if (!user || !course) {
        return res.status(404).json({ error: "User or course not found" });
      }
      const userCourse = await storage.getUserCourse(userId, courseId);
      if (!userCourse || !userCourse.completedAt) {
        return res.status(400).json({ error: "Course not completed" });
      }
      if (userCourse.rewardClaimed) {
        return res.status(400).json({ error: "Reward already claimed" });
      }
      const rewardAmount = parseFloat((Math.random() * (course.maxReward - course.minReward) + course.minReward).toFixed(2));
      const txHash = "0x" + Math.random().toString(16).substring(2, 14);
      const reward = await storage.createReward({
        userId,
        amount: rewardAmount,
        reason: "Course Completion",
        courseId,
        txHash
      });
      await storage.updateUser(userId, {
        balance: (user.balance || 0) + rewardAmount
      });
      await storage.updateUserCourse(userCourse.id, {
        rewardClaimed: true,
        rewardAmount
      });
      return res.status(201).json({
        reward,
        newBalance: (user.balance || 0) + rewardAmount
      });
    } catch (error) {
      console.error("Create reward error:", error);
      return res.status(500).json({ error: "Failed to create reward" });
    }
  });
  apiRouter.post("/api/users/:userId/referral", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { referralCode } = req.body;
      if (isNaN(userId) || !referralCode) {
        return res.status(400).json({ error: "Invalid user ID or referral code" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const referrer = Array.from(await storage.getAllUsers() || []).find((u) => u.referralCode === referralCode);
      if (!referrer) {
        return res.status(404).json({ error: "Referrer not found" });
      }
      if (user.referredBy) {
        return res.status(400).json({ error: "User already has a referrer" });
      }
      await storage.updateUser(userId, {
        referredBy: referrer.id.toString()
      });
      await storage.updateUser(referrer.id, {
        referralCount: (referrer.referralCount || 0) + 1
      });
      const rewardAmount = 0.05;
      const txHash = "0x" + Math.random().toString(16).substring(2, 14);
      const reward = await storage.createReward({
        userId: referrer.id,
        amount: rewardAmount,
        reason: "Referral Bonus",
        courseId: null,
        txHash
      });
      await storage.updateUser(referrer.id, {
        balance: (referrer.balance || 0) + rewardAmount
      });
      return res.json({
        success: true,
        referrer: referrer.displayName
      });
    } catch (error) {
      console.error("Referral error:", error);
      return res.status(500).json({ error: "Failed to process referral" });
    }
  });
  app2.use(apiRouter);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT || 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`Server running at http://0.0.0.0:${port}`);
  });
})();
