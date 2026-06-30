const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper Regex for basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 1. SIGNUP CONTROLLER
const signup = async (req, res) => {
  const { organization_name, reg_number, user_name, email, password } = req.body;

  if (!organization_name || !user_name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  // Sanitize and validate inputs
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const client = await pool.connect();

  try {
    // Check if the email already exists
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered. Please log in.' });
    }

    await client.query('BEGIN'); // Start Transaction

    // Step A: Create the Organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, reg_number) VALUES ($1, $2) RETURNING id`,
      [organization_name.trim(), reg_number ? reg_number.trim() : null]
    );
    const orgId = orgResult.rows[0].id;

    // Step B: Hash the password
    const saltRounds = 12; // Increased from 10 to 12 for modern security standards
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Step C: Create the User
    const userResult = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [orgId, user_name.trim(), normalizedEmail, password_hash, 'admin']
    );

    await client.query('COMMIT'); // Save changes

    res.status(201).json({
      message: 'Account created successfully!',
      user: userResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again later.' });
  } finally {
    client.release();
  }
};

// 2. LOGIN CONTROLLER
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Step A: Find the user in the database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' }); // Keep error vague for security
    }

    const user = userResult.rows[0];

    // Step B: Compare the password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Step C: Generate the JWT Token 
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organization_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization_id: user.organization_id
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

// 3. UPDATE USER PROFILE
const updateProfile = async (req, res) => {
  const userId = req.user.userId; 
  const { user_name, email } = req.body;

  if (!user_name || !email) {
    return res.status(400).json({ error: 'Please provide both user_name and email to update.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    // Prevent user from changing their email to one that belongs to someone else
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2', 
      [normalizedEmail, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'That email address is already in use.' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, email = $2 
       WHERE id = $3 
       RETURNING id, name, email, role`,
      [user_name.trim(), normalizedEmail, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// 4. DELETE USER ACCOUNT
const deleteAccount = async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      message: 'Your account has been successfully deleted.'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
};

module.exports = { signup, login, updateProfile, deleteAccount };