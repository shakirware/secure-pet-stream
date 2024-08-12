const logger = require('../utils/logger');

const localHostOnly = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const localIps = ['::1', '::ffff:127.0.0.1', '127.0.0.1', 'localhost'];

  if (localIps.includes(clientIp)) {
    next();
  } else {
    logger.warn('Unauthorized registration attempt', { ip: clientIp });
    res.status(403).json({ error: 'Registration is only allowed from localhost' });
  }
};

module.exports = localHostOnly;