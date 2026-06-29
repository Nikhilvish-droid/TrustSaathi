const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. SIGNUP CONTROLLER
const signup = async (req, res) => {
  const { organization_name, reg_number, user_name, email, password } = req.body;

  if (!organization_name || !user_name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  const client = await pool.connect();

  try {
    // Check if the email already exists
    const userCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    await client.query('BEGIN'); // Start Transaction

    // Step A: Create the Organization
    const orgResult = await client.query(
      `INSERT INTO organizations (name, reg_number) VALUES ($1, $2) RETURNING id`,
      [organization_name, reg_number]
    );
    const orgId = orgResult.rows[0].id;

    // Step B: Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Step C: Create the User (Defaulting to 'admin' for the first creator)
    const userResult = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role`,
      [orgId, user_name, email, password_hash, 'admin']
    );

    await client.query('COMMIT'); // Save changes

    res.status(201).json({
      message: 'Account created successfully!',
      user: userResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
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

  try {
    // Step A: Find the user in the database
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userResult.rows[0];

    // Step B: Compare the password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Step C: Generate the JWT Token (Valid for 24 hours)
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

module.exports = { signup, login };