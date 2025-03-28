import { pgTable, text, serial, integer, timestamp, boolean, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for users registered in the system
export const users = pgTable("users", {
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
  referralTier: integer("referral_tier").default(0).notNull(), // 0: Base, 1: Bronze, 2: Silver, 3: Gold
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, balance: true, referralCount: true, referralTier: true });

// Courses table - for educational courses
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  duration: text("duration").notNull(),
  thumbnail: text("thumbnail").notNull(),
  minReward: real("min_reward").notNull(),
  maxReward: real("max_reward").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
  // Added fields for enhanced certificates
  skills: text("skills").array(),
  category: text("category").default("general"),
});

export const insertCourseSchema = createInsertSchema(courses)
  .omit({ id: true, createdAt: true, active: true });

// Lessons table - for individual lessons within courses
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  duration: text("duration").notNull(),
  orderNumber: integer("order_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLessonSchema = createInsertSchema(lessons)
  .omit({ id: true, createdAt: true });

// UserCourses table - for tracking user course progress
export const userCourses = pgTable("user_courses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  rewardClaimed: boolean("reward_claimed").default(false).notNull(),
  rewardAmount: real("reward_amount"),
});

export const insertUserCourseSchema = createInsertSchema(userCourses)
  .omit({ id: true, progress: true, startedAt: true, completedAt: true, rewardClaimed: true, rewardAmount: true });

// UserLessons table - for tracking lesson completion
export const userLessons = pgTable("user_lessons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertUserLessonSchema = createInsertSchema(userLessons)
  .omit({ id: true, completed: true, completedAt: true });

// Certificates table - for storing SBT certificates
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  name: text("name").notNull(),
  courseTitle: text("course_title").notNull(),
  issuedDate: date("issued_date").notNull(),
  tokenId: text("token_id"),
  txHash: text("tx_hash"),
  // Enhanced metadata for more complex certificates
  templateId: text("template_id").default("default"),
  badgeUrl: text("badge_url"),
  description: text("description"),
  skills: text("skills").array(),
  issuer: text("issuer").default("TON EDUCATION"),
  certificateType: text("certificate_type").default("completion"),
  backgroundColor: text("background_color").default("#f8fafc"),
  borderColor: text("border_color").default("#0ea5e9"),
  validUntil: date("valid_until"),
  metadataJson: text("metadata_json"),
});

export const insertCertificateSchema = createInsertSchema(certificates)
  .omit({ id: true });

// Rewards table - for tracking reward distributions
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  courseId: integer("course_id"),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRewardSchema = createInsertSchema(rewards)
  .omit({ id: true, createdAt: true });

// ReferralTiers table - for storing tier information
export const referralTiers = pgTable("referral_tiers", {
  id: serial("id").primaryKey(),
  tier: integer("tier").notNull().unique(),
  name: text("name").notNull(),
  requiredReferrals: integer("required_referrals").notNull(),
  rewardMultiplier: real("reward_multiplier").notNull(),
  color: text("color").notNull(),
  icon: text("icon"),
});

export const insertReferralTierSchema = createInsertSchema(referralTiers)
  .omit({ id: true });

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type UserCourse = typeof userCourses.$inferSelect;
export type InsertUserCourse = z.infer<typeof insertUserCourseSchema>;

export type UserLesson = typeof userLessons.$inferSelect;
export type InsertUserLesson = z.infer<typeof insertUserLessonSchema>;

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type ReferralTier = typeof referralTiers.$inferSelect;
export type InsertReferralTier = z.infer<typeof insertReferralTierSchema>;

// Admin schema
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true)
});

export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true, lastLogin: true });

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
