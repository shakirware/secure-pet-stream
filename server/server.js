require('dotenv').config();
const app = require('./src/app'); // Import the Express app
const connectDB = require('./src/config/database'); // Import the database connection function
const logger = require('./src/utils/logger'); // Import the logger

const port = process.env.PORT || 3001; // Define the port

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Start the Express server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    // Log any errors and exit the process
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Call the startServer function to initiate the server
startServer();
