/**
 * One-time script to make Test@test.com an admin
 * Run with: node scripts/make-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diasporaecho';

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
});

const User = mongoose.model('User', UserSchema);

async function makeAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await User.findOneAndUpdate(
            { email: 'Test@test.com' },
            { role: 'admin' },
            { new: true }
        );

        if (result) {
            console.log(`✅ Updated ${result.email} to admin role`);
        } else {
            // Try lowercase
            const result2 = await User.findOneAndUpdate(
                { email: 'test@test.com' },
                { role: 'admin' },
                { new: true }
            );
            if (result2) {
                console.log(`✅ Updated ${result2.email} to admin role`);
            } else {
                console.log('❌ User not found with email Test@test.com or test@test.com');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

makeAdmin();
