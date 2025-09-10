// MySQL Database Configuration
// Note: In a production React app, you would typically use a backend API
// This is for demonstration purposes - you'll need a backend server

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export const dbConfig: DatabaseConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root', // Change this to your MySQL username
  password: '', // Change this to your MySQL password
  database: 'forward_africa_db'
};

// API Base URL for backend communication
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

// Database connection string (for reference)
export const getConnectionString = () => {
  return `mysql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
};

// Environment variables (create a .env.local file in your project root)
// NEXT_PUBLIC_API_URL=http://localhost:3002/api
// NEXT_PUBLIC_APP_URL=http://localhost:3000
// NEXT_PUBLIC_DB_HOST=localhost
// NEXT_PUBLIC_DB_PORT=3306
// NEXT_PUBLIC_DB_NAME=forward_africa_db

export const getEnvConfig = () => {
  return {
    host: process.env.NEXT_PUBLIC_DB_HOST || 'localhost',
    port: parseInt(process.env.NEXT_PUBLIC_DB_PORT || '3306'),
    user: 'root', // Database user should not be exposed to frontend
    password: '', // Database password should not be exposed to frontend
    database: process.env.NEXT_PUBLIC_DB_NAME || 'forward_africa_db',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'
  };
};