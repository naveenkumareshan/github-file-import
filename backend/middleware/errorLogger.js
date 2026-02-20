const ErrorLog = require('../models/ErrorLog');

// Middleware to log errors to database
const errorLogger = async (err, req, res, next) => {
  try {
    console.log(req.user)
    // Extract error information
    const errorData = {
      level: 'error',
      message: err.message || 'Unknown error occurred',
      stack: err.stack,
      source: req.originalUrl || req.url || 'Unknown endpoint',
      userId: req.userId?._id || null,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: err.statusCode || err.status || 500,
      errorCode: err.code || err.name || 'INTERNAL_ERROR',
      metadata: {
        body: req.body,
        params: req.params,
        query: req.query,
        headers: {
          'content-type': req.get('Content-Type'),
          'authorization': req.get('Authorization') ? '[HIDDEN]' : undefined,
          'referer': req.get('Referer'),
          'origin': req.get('Origin')
        }
      }
    };

    // Don't log sensitive information
    if (errorData.metadata.body && errorData.metadata.body.password) {
      errorData.metadata.body.password = '[HIDDEN]';
    }

    // Save error to database
    await ErrorLog.create(errorData);
    
    console.error(`Error logged to database: ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      userId: req.user?._id,
      stack: err.stack
    });

  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }

  // Continue to the next error handler
  next(err);
};

// Middleware to catch async errors
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled rejection handler
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', async (reason, promise) => {
    try {
      await ErrorLog.create({
        level: 'error',
        message: `Unhandled Promise Rejection: ${reason}`,
        stack: reason.stack || 'No stack trace available',
        source: 'unhandledRejection',
        errorCode: 'UNHANDLED_REJECTION',
        metadata: {
          promise: promise.toString(),
          reason: reason.toString()
        }
      });
    } catch (logError) {
      console.error('Failed to log unhandled rejection:', logError);
    }
    
    console.error('Unhandled Promise Rejection:', reason);
  });
};

// Global uncaught exception handler
const handleUncaughtException = () => {
  process.on('uncaughtException', async (err) => {
    try {
      await ErrorLog.create({
        level: 'error',
        message: `Uncaught Exception: ${err.message}`,
        stack: err.stack,
        source: 'uncaughtException',
        errorCode: 'UNCAUGHT_EXCEPTION',
        metadata: {
          name: err.name,
          code: err.code
        }
      });
    } catch (logError) {
      console.error('Failed to log uncaught exception:', logError);
    }
    
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
};

// Request logging middleware for debugging
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    
    // Log slow requests or errors
    if (duration > 5000 || res.statusCode >= 400) {
      try {
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        
        await ErrorLog.create({
          level,
          message: `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
          source: req.originalUrl || req.url,
          userId: req.user?._id || null,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          errorCode: res.statusCode >= 400 ? `HTTP_${res.statusCode}` : 'SLOW_REQUEST',
          metadata: {
            duration,
            body: req.body,
            params: req.params,
            query: req.query
          }
        });
      } catch (logError) {
        console.error('Failed to log request:', logError);
      }
    }
  });
  
  next();
};

module.exports = {
  errorLogger,
  asyncErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  requestLogger
};