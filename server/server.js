require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
const NodeMediaServer = require('node-media-server');

const port = process.env.PORT || 3001;

const nmsConfig = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*'
  }
};

const nms = new NodeMediaServer(nmsConfig);

const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });

    nms.run();
    logger.info('RTMP server started');
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();