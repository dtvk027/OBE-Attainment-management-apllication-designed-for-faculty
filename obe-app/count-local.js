const { PrismaClient } = require('@prisma/client');
const path = require('path');

// Manually point to local SQLite for this check
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, 'prisma', 'dev.db')}`
    }
  }
});

async function main() {
  console.log('--- LOCAL DATABASE STATS ---');
  try {
    const models = [
      'user', 'academicYear', 'semester', 'template', 
      'globalSubject', 'subject', 'student', 'mark', 
      'cOPOMapping', 'surveyResponse', 'uploadedFile'
    ];

    for (const model of models) {
      const count = await localPrisma[model].count();
      console.log(`${model}: ${count} records`);
    }
  } catch (error) {
    console.error('Error counting records:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

main();
