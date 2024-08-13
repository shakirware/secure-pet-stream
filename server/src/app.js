const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const streamRoutes = require('./routes/stream');
const liveRoutes = require('./routes/liveRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Enable trust proxy
app.set('trust proxy', true);

app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(cors());

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use('/auth', authRoutes);
app.use('/stream', streamRoutes);
app.use('/live', liveRoutes);

app.use(errorHandler);

module.exports = app;
