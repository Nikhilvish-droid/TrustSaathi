const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  // 1. Safety Check: Ensure the secret exists before trying to verify anything
  if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL ERROR: JWT_SECRET is not defined in the environment.');
    return res.status(500).json({ error: 'Internal server configuration error.' });
  }

  // 2. Grab the token from the request headers
  const authHeader = req.headers.authorization;

  // 3. Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  // 4. Extract just the token string (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  // 5. Ensure the token actually exists after splitting 
  // (Protects against malformed headers like "Bearer ")
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token is malformed.' });
  }

  try {
    // 6. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 7. Attach the decoded user data (like organization_id) to the request
    req.user = decoded;
    
    // 8. Pass control to the next function (the controller)
    next();
  } catch (error) {
    // 9. Differentiate between an expired token and a tampered/invalid token
    // This allows Developer 3 to automatically redirect users to the login screen if their session expires naturally
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    }
    
    return res.status(403).json({ error: 'Invalid token. Authorization denied.' });
  }
};

module.exports = verifyToken;