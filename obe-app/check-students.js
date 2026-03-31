const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subjectId = 8;
  const students = await prisma.student.findMany({
    where: { subjectId },
    include: { marks: true }
  });

  console.log(`--- Students for Subject ${subjectId} ---`);
  students.forEach(s => {
    console.log(`ID: ${s.id}, RegNo: "${s.regNumber}", Marks: ${s.marks.length}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
