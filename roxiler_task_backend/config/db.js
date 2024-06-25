// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connected = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        if (connected) {
            console.log('MongoDB connected');
        }
        return connected;
    } catch (error) {
        console.error('MongoDB connection failed', error);
        process.exit(1);
    }
};

module.exports = connectDB;
