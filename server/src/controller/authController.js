const User = require("../models/User");
const UserLog = require("../models/UserLog");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const registerUser = async (req, res) => {
    try {
        console.log("request recevied");
        const { FullName, email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({ FullName, email, password: hashedPassword, role: role || "user" });  // Default role is "user"
        await user.save();

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId: user._id, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Create a user log entry
        const userLog = new UserLog({
            userId: user._id,
            username: user.email,
            role: user.role,
            ipAddress: req.ip,
            tokenName: token,
        });
        await userLog.save();

        res.json({ token, userId: user._id, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


module.exports = { registerUser, loginUser };
