const pool = require("../db/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // 1. Basic validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check if email already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);



    // 4. Insert new user and return needed fields
    const newUserResult = await pool.query(
      `INSERT INTO users (name, email, phone, password,balance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone,balance`,
      [name, email, phone, hashedPassword,0.00]
    );

    const newUser = newUserResult.rows[0];

    // 5. Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }   // you can change to '1h', '7d', etc.
    );

    // 6. Send token + user info (so frontend can save both)
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,    // consistent key name
        email: newUser.email,
        phone: newUser.phone,
        balance: parseFloat(newUser.balance)
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 1. Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // 2. Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 4. Send response with token + user info
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,     // consistent key name
        email: user.email,
        phone: user.phone,
        balance: parseFloat(user.balance)
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Server error during login" });
  }
};
// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: " name and email are required" });
    }

    const result = await pool.query(`
      UPDATE users 
      SET name = $1, 
          email = $2, 
          phone = $3
      WHERE id = $4 
      RETURNING id, name, email, phone, balance
    `, [name, email, phone, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        balance: parseFloat(updatedUser.balance)
      }
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    // Get user from database
    const result = await pool.query("SELECT password FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    // Check if current password is correct
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedNewPassword, userId]);

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ message: "Failed to change password" });
  }
};