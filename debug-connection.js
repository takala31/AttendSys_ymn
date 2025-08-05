// Debug script to show MongoDB connection info (without sensitive data)
require('dotenv').config();

console.log('=== MongoDB Connection Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    
    // Parse the URI to show connection details without password
    if (uri.includes('mongodb+srv://')) {
        console.log('Database Type: MongoDB Atlas (Cloud)');
        
        // Extract cluster info without showing password
        const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)/);
        if (match) {
            console.log('Username:', match[1]);
            console.log('Cluster Host:', match[3]);
            console.log('Database Name:', match[4]);
            console.log('Full URI (masked):', uri.replace(/:[^@]*@/, ':****@'));
        }
    } else if (uri.includes('mongodb://')) {
        console.log('Database Type: MongoDB Standard');
        console.log('URI (masked):', uri.replace(/:[^@]*@/, ':****@'));
    }
} else {
    console.log('❌ MONGODB_URI not found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('MONGO')));
}

console.log('=== End Debug Info ===');
