require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const tonConnect = require('@tonconnect/sdk');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ton_education',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Initialize TonConnect
const connector = new tonConnect.TonConnect({
    manifestUrl: 'https://ton-education.app/tonconnect-manifest.json'
});

// API Routes

// User Authentication
app.post('/api/auth/telegram', async (req, res) => {
    const { initData } = req.body;
    
    try {
        // Verify Telegram authentication data
        // In production, use proper verification
        const userData = JSON.parse(initData).user;
        
        // Check if user exists
        const userResult = await pool.query(
            'SELECT * FROM users WHERE telegram_id = $1',
            [userData.id]
        );
        
        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUser = await pool.query(
                'INSERT INTO users (telegram_id, username, first_name, last_name, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                [userData.id, userData.username, userData.first_name, userData.last_name || '']
            );
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.error('Telegram auth error:', error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
});

// Wallet Connection
app.post('/api/wallet/connect', async (req, res) => {
    const { userId, walletAddress } = req.body;
    
    try {
        await pool.query(
            'UPDATE users SET wallet_address = $1 WHERE id = $2',
            [walletAddress, userId]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Wallet connection error:', error);
        res.status(500).json({ success: false, error: 'Failed to connect wallet' });
    }
});

// Courses
app.get('/api/courses', async (req, res) => {
    try {
        const courses = await pool.query(
            'SELECT * FROM courses ORDER BY difficulty_level, id'
        );
        
        // Get user progress if authenticated
        let userProgress = [];
        if (req.query.userId) {
            const progressResult = await pool.query(
                'SELECT course_id, progress FROM user_progress WHERE user_id = $1',
                [req.query.userId]
            );
            userProgress = progressResult.rows;
        }
        
        // Combine courses with progress
        const result = courses.rows.map(course => {
            const progress = userProgress.find(p => p.course_id === course.id);
            return {
                ...course,
                progress: progress ? progress.progress : 0
            };
        });
        
        res.json({ success: true, courses: result });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ success: false, error: 'Failed to load courses' });
    }
});

// Course Progress
app.post('/api/courses/progress', async (req, res) => {
    const { userId, courseId, progress } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO user_progress (user_id, course_id, progress, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, course_id) DO UPDATE SET progress = $3, updated_at = NOW()',
            [userId, courseId, progress]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ success: false, error: 'Failed to update progress' });
    }
});

// Complete Course
app.post('/api/courses/complete', async (req, res) => {
    const { userId, courseId } = req.body;
    
    try {
        // Get course reward range
        const courseResult = await pool.query(
            'SELECT reward_min, reward_max FROM courses WHERE id = $1',
            [courseId]
        );
        
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        
        const course = courseResult.rows[0];
        
        // Calculate random reward
        const reward = course.reward_min + Math.random() * (course.reward_max - course.reward_min);
        
        // Record completion
        await pool.query('BEGIN');
        
        // Update progress to 100%
        await pool.query(
            'INSERT INTO user_progress (user_id, course_id, progress, updated_at) VALUES ($1, $2, 100, NOW()) ON CONFLICT (user_id, course_id) DO UPDATE SET progress = 100, updated_at = NOW()',
            [userId, courseId]
        );
        
        // Add reward
        await pool.query(
            'INSERT INTO rewards (user_id, course_id, amount, status) VALUES ($1, $2, $3, $4)',
            [userId, courseId, reward, 'pending']
        );
        
        // Create certificate record
        await pool.query(
            'INSERT INTO certificates (user_id, course_id, reward_amount, nft_id, created_at) VALUES ($1, $2, $3, $4, NOW())',
            [userId, courseId, reward, `EQ${generateRandomId()}`]
        );
        
        await pool.query('COMMIT');
        
        res.json({ 
            success: true, 
            reward: parseFloat(reward.toFixed(2)),
            nftId: `EQ${generateRandomId()}`
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Complete course error:', error);
        res.status(500).json({ success: false, error: 'Failed to complete course' });
    }
});

// Rewards
app.get('/api/rewards', async (req, res) => {
    const { userId } = req.query;
    
    try {
        const rewards = await pool.query(
            'SELECT r.*, c.title as course_title FROM rewards r JOIN courses c ON r.course_id = c.id WHERE r.user_id = $1 ORDER BY r.created_at DESC',
            [userId]
        );
        
        res.json({ success: true, rewards: rewards.rows });
    } catch (error) {
        console.error('Get rewards error:', error);
        res.status(500).json({ success: false, error: 'Failed to load rewards' });
    }
});

// Claim Reward
app.post('/api/rewards/claim', async (req, res) => {
    const { userId, rewardId } = req.body;
    
    try {
        // Get reward details
        const rewardResult = await pool.query(
            'SELECT * FROM rewards WHERE id = $1 AND user_id = $2',
            [rewardId, userId]
        );
        
        if (rewardResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Reward not found' });
        }
        
        const reward = rewardResult.rows[0];
        
        // Get user wallet address
        const userResult = await pool.query(
            'SELECT wallet_address FROM users WHERE id = $1',
            [userId]
        );
        
        if (!userResult.rows[0]?.wallet_address) {
            return res.status(400).json({ success: false, error: 'Wallet not connected' });
        }
        
        // In a real app, this would create a TON transaction
        // For MVP, we'll just mark it as claimed
        await pool.query(
            'UPDATE rewards SET status = $1, claimed_at = NOW() WHERE id = $2',
            ['claimed', rewardId]
        );
        
        res.json({ 
            success: true,
            transaction: {
                to: userResult.rows[0].wallet_address,
                amount: reward.amount,
                memo: `TON EDUCATION reward for ${reward.course_id}`
            }
        });
    } catch (error) {
        console.error('Claim reward error:', error);
        res.status(500).json({ success: false, error: 'Failed to claim reward' });
    }
});

// Certificates
app.get('/api/certificates', async (req, res) => {
    const { userId } = req.query;
    
    try {
        const certificates = await pool.query(
            'SELECT c.*, co.title as course_title FROM certificates c JOIN courses co ON c.course_id = co.id WHERE c.user_id = $1 ORDER BY c.created_at DESC',
            [userId]
        );
        
        res.json({ success: true, certificates: certificates.rows });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ success: false, error: 'Failed to load certificates' });
    }
});

// TON News
app.get('/api/news', async (req, res) => {
    try {
        // In a real app, this would fetch from a database or API
        const news = [
            {
                id: 1,
                title: "TON Foundation Announces New Grants",
                content: "The TON Foundation has allocated $50M for ecosystem development grants to support builders in the TON space.",
                published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                source: "TON Official"
            },
            {
                id: 2,
                title: "New Wallet Feature Released",
                content: "Latest update includes NFT display and improved security features for all TON wallets.",
                published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                source: "TON Wallet Team"
            },
            {
                id: 3,
                title: "TON Partners with Major Exchange",
                content: "TON blockchain now integrated with Binance for direct deposits and withdrawals.",
                published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                source: "Binance Blog"
            }
        ];
        
        res.json({ success: true, news });
    } catch (error) {
        console.error('Get news error:', error);
        res.status(500).json({ success: false, error: 'Failed to load news' });
    }
});

// Helper function
function generateRandomId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
