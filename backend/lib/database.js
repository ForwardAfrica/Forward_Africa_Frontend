const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', // Changed default to root
    password: process.env.DB_PASSWORD || '', // Empty password by default
    database: process.env.DB_NAME || 'forward_africa_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
    // Removed deprecated options: acquireTimeout, timeout, reconnect
};

// Create connection pool
let pool = null;

// Initialize database connection pool
function initializePool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);

        // Test the connection
        pool.getConnection()
            .then(connection => {
                console.log('Database connected successfully');
                connection.release();
            })
            .catch(err => {
                console.error('Database connection failed:', err);
                console.log('⚠️ Server will continue running with limited functionality');
                // Don't exit the process, let the server continue
            });
    }
    return pool;
}

// Get database pool
function getPool() {
    if (!pool) {
        initializePool();
    }
    return pool;
}

// Execute a query with parameters
async function executeQuery(query, params = []) {
    try {
        const connection = await getPool().getConnection();

        try {
            const [results] = await connection.execute(query, params);
            return results;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Database query error:', error);
        console.error('Query:', query);
        console.error('Parameters:', params);

        // If it's a connection error, return empty results instead of crashing
        if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ECONNREFUSED') {
            console.log('⚠️ Database not available, returning empty results');
            return [];
        }

        throw error;
    }
}

// Execute a query and return the first row
async function executeQuerySingle(query, params = []) {
    const results = await executeQuery(query, params);
    return results.length > 0 ? results[0] : null;
}

// Execute a transaction
async function executeTransaction(queries) {
    const connection = await getPool().getConnection();

    try {
        await connection.beginTransaction();

        const results = [];
        for (const { query, params = [] } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }

        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        console.error('Transaction error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Execute a stored procedure
async function executeStoredProcedure(procedureName, params = []) {
    const connection = await getPool().getConnection();

    try {
        const [results] = await connection.execute(`CALL ${procedureName}(${params.map(() => '?').join(',')})`, params);
        return results;
    } catch (error) {
        console.error('Stored procedure error:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Check if database is connected
async function checkConnection() {
    try {
        const connection = await getPool().getConnection();
        await connection.ping();
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection check failed:', error);
        return false;
    }
}

// Close database connections
async function closeConnections() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Database connections closed');
    }
}

// Health check for database
async function healthCheck() {
    try {
        const isConnected = await checkConnection();
        if (!isConnected) {
            return { status: 'warning', message: 'Database connection failed - running in limited mode' };
        }

        // Test a simple query
        const result = await executeQuerySingle('SELECT 1 as test');
        if (result && result.test === 1) {
            return { status: 'healthy', message: 'Database is working correctly' };
        } else {
            return { status: 'warning', message: 'Database query test failed - running in limited mode' };
        }
    } catch (error) {
        return { status: 'warning', message: `Database error: ${error.message} - running in limited mode` };
    }
}

// Initialize database on module load
initializePool();

module.exports = {
    getPool,
    executeQuery,
    executeQuerySingle,
    executeTransaction,
    executeStoredProcedure,
    checkConnection,
    closeConnections,
    healthCheck
};