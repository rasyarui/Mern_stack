const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getUserLogs, deleteUserLog } = require('../controller/adminController');

const router = express.Router();

// Example: Admin-only route
router.get('/dashboard', protect, adminOnly, (req, res) => {
    res.json({ message: "Welcome to the admin dashboard" });
});

// User logs routes
router.get('/logs', protect, adminOnly, getUserLogs);
router.delete('/logs/:id', protect, adminOnly, deleteUserLog);

module.exports = router;
