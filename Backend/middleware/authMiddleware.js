const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  // 1. Grab the token from the request headers
  const authHeader = req.headers.authorization;

  // 2. Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  // 3. Extract just the token string (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 5. Attach the decoded user data (like organization_id) to the request
    req.user = decoded;
    
    // 6. Pass control to the next function (the controller)
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

module.exports = verifyToken;