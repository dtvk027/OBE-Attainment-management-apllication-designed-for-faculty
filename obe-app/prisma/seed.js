const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// We need the parser to seed actual data
const WorkbookParser = require('../src/lib/xlsx/workbook-parser');

async function main() {
  console.log("Seeding default OBE data...");

  // 1. Create Academic Year and Semester
  const ay = await prisma.academicYear.upsert({
    where: { label: '2026-27' },
    update: {},
    create: { label: '2026-27' }
  });

  const sem = await prisma.semester.upsert({
    where: { academicYearId_number: { academicYearId: ay.id, number: 6 } },
    update: {},
    create: { academicYearId: ay.id, number: 6 }
  });

  // 2. Create Admin and Faculty Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@college.edu',
      passwordHash: adminPasswordHash,
      role: 'admin'
    }
  });

  const facultyPasswordHash = await bcrypt.hash('faculty123', 10);
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@college.edu' },
    update: {},
    create: {
      name: 'Dr. Vamsi Krishna',
      email: 'faculty@college.edu',
      passwordHash: facultyPasswordHash,
      role: 'faculty',
      department: 'CSE'
    }
  });

  // 3. Create Default Template
  const templateName = "2-Mid OBE Attainment Format (Default)";
  let template = await prisma.template.findFirst({ where: { name: templateName } });
  
  const templateData = {
    name: templateName,
    coCount: 5,
    poCount: 12,
    psoCount: 3,
    targetPercentage: 60,
    attainmentThresholds: JSON.stringify({ level_3: 70, level_2: 60, level_1: 50 }),
    directWeightage: 0.9,
    indirectWeightage: 0.1,
    surveyGrading: JSON.stringify({ excellent: 3, satisfactory: 2, average: 1 }),
    assessmentGroups: JSON.stringify({
      internal: [
        { id: "mid_01", label: "Mid-01", max_marks_total: 15, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] },
        { id: "mid_02", label: "Mid-02", max_marks_total: 15, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] },
        { id: "quiz", label: "Quiz", max_marks_total: 20, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] },
        { id: "assignment", label: "Assignment", max_marks_total: 20, per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }
      ],
      end_semester: { id: "end_sem", label: "End Examination", per_co: true, co_columns: ["CO1", "CO2", "CO3", "CO4", "CO5"] }
    })
  };

  if (!template) {
    template = await prisma.template.create({ data: templateData });
  } else {
    template = await prisma.template.update({ where: { id: template.id }, data: templateData });
  }

  // 4. Create the Subject with Upsert
  const subject = await prisma.subject.upsert({
    where: {
      code_semesterId_section: {
        code: "CSEN3171",
        semesterId: sem.id,
        section: "A"
      }
    },
    update: {
      totalRegistered: 66,
      templateId: template.id,
      facultyId: faculty.id
    },
    create: {
      code: "CSEN3171",
      name: "Advances in Internet of Things",
      courseType: "PC",
      department: "CSE",
      program: "UG-CSE",
      facultyId: faculty.id,
      semesterId: sem.id,
      section: "A",
      templateId: template.id,
      totalRegistered: 66
    }
  });

  // 5. PARSE EXCEL AND SEED STUDENTS/MARKS
  const excelPath = path.join(__dirname, '../../AIoT-118-THEORY- 2-Mid OBE Attainment Format.xls');
  if (fs.existsSync(excelPath)) {
    console.log("Found Excel file, parsing/updating demo data...");
    const parsedData = WorkbookParser.parse(excelPath, template);

    // Update metadata
    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        coStatements: JSON.stringify(parsedData.metadata.coStatements)
      }
    });

    // Clear old data for a fresh start if subject existed
    await prisma.mark.deleteMany({ where: { subjectId: subject.id } });
    await prisma.student.deleteMany({ where: { subjectId: subject.id } });
    await prisma.cOPOMapping.deleteMany({ where: { subjectId: subject.id } });
    await prisma.surveyResponse.deleteMany({ where: { subjectId: subject.id } });

    console.log(`Inserting ${parsedData.students.length} students...`);
    for (const student of parsedData.students) {
      const dbStudent = await prisma.student.create({
        data: {
          regNumber: student.regNumber,
          subjectId: subject.id,
        }
      });

      // Insert Marks
      const marksData = student.marks
        .filter(m => m.marksObtained !== null || m.maxMarks > 0)
        .map(m => ({
          studentId: dbStudent.id,
          subjectId: subject.id,
          assessmentId: m.assessmentId,
          coCode: m.coCode,
          marksObtained: m.marksObtained,
          maxMarks: m.maxMarks
        }));
      
      if (marksData.length > 0) {
        await prisma.mark.createMany({ data: marksData });
      }
    }

    // Seed CO-PO Mappings
    if (parsedData.coPoMappings.length > 0) {
      await prisma.cOPOMapping.createMany({
        data: parsedData.coPoMappings.map(m => ({
          subjectId: subject.id,
          coCode: m.coCode,
          poCode: m.poCode,
          mappingValue: m.mappingValue
        }))
      });
    }

    // Seed Survey Responses
    if (parsedData.surveyResponses.length > 0) {
      await prisma.surveyResponse.createMany({
        data: parsedData.surveyResponses.map(s => ({
          subjectId: subject.id,
          coCode: s.coCode,
          excellentCount: s.excellentCount,
          satisfactoryCount: s.satisfactoryCount,
          averageCount: s.averageCount,
          totalParticipants: s.totalParticipants
        }))
      });
    }

    console.log("Demo data seeded successfully from Excel.");
  } else {
    console.warn("Excel file not found at " + excelPath + ". Skipping student/mark seeding.");
  }

  console.log(`\nFaculty: ${faculty.email} / faculty123`);
  console.log(`Admin: ${admin.email} / admin123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
