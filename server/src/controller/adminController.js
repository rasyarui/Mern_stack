const UserLog = require('../models/UserLog');

const getUserLogs = async (req, res) => {
    try {
        const logs = await UserLog.find().sort({ loginTime: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

const deleteUserLog = async (req, res) => {
    try {
        const { id } = req.params;
        await UserLog.findByIdAndDelete(id);
        res.json({ message: "Log deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getUserLogs, deleteUserLog };
