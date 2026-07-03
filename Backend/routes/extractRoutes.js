const express = require('express');
const multer = require('multer');
const verifyToken = require('../middleware/authMiddleware');
const { proxyExtract } = require('../controllers/extractController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', verifyToken, upload.single('file'), proxyExtract);

module.exports = router;
