const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const years = await prisma.academicYear.findMany();
  const semesters = await prisma.semester.findMany();
  const subjects = await prisma.subject.findMany();
  const templates = await prisma.template.findMany();
  const users = await prisma.user.findMany();

  console.log('--- DB STATS ---');
  console.log('Years:', years.length);
  console.log('Semesters:', semesters.length);
  console.log('Subjects:', subjects.length);
  console.log('Templates:', templates.length);
  console.log('Users:', users.length);
  
  if (years.length > 0) {
    console.log('\n--- Academic Years ---');
    years.forEach(y => console.log(`- ${y.label} (ID: ${y.id})`));
  }
  
  if (templates.length > 0) {
    console.log('\n--- Templates ---');
    templates.forEach(t => console.log(`- ${t.name} (ID: ${t.id})`));
  } else {
    console.log('\nWARNING: No templates found!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
