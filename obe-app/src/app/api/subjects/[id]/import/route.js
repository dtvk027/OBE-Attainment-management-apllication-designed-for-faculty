import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import MainParser from '@/lib/xlsx/parser';
import { getSession } from '@/lib/auth';
import { uploadSubjectFile } from '@/lib/supabase';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subjectId = parseInt(params.id);
    if (isNaN(subjectId)) {
      return NextResponse.json({ error: 'Invalid Subject ID' }, { status: 400 });
    }

    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      include: { template: true }
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    if (subject.facultyId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `subjects/${subjectId}/${sanitizedFilename}`;

    const parsedObj = MainParser.parse(buffer, { template: subject.template });

    if (parsedObj.type === 'full_workbook') {
      const parsedData = parsedObj.data;

      const uploadResult = await uploadSubjectFile(storagePath, buffer, file.type || 'application/octet-stream');
      if (uploadResult.error) {
        throw uploadResult.error;
      }

      await db.$transaction(async (tx) => {
        await tx.subject.update({
          where: { id: subjectId },
          data: {
            coStatements: JSON.stringify(parsedData.metadata.coStatements),
          }
        });

        for (const student of parsedData.students) {
          const dbStudent = await tx.student.upsert({
            where: { regNumber_subjectId: { regNumber: student.regNumber, subjectId } },
            update: {},
            create: {
              regNumber: student.regNumber,
              subjectId,
            }
          });

          for (const mark of student.marks) {
            if (mark.marksObtained !== null || mark.maxMarks > 0) {
              await tx.mark.upsert({
                where: {
                  studentId_subjectId_assessmentId_coCode: {
                    studentId: dbStudent.id,
                    subjectId,
                    assessmentId: mark.assessmentId,
                    coCode: mark.coCode,
                  }
                },
                update: {
                  marksObtained: mark.marksObtained,
                  maxMarks: mark.maxMarks,
                },
                create: {
                  studentId: dbStudent.id,
                  subjectId,
                  assessmentId: mark.assessmentId,
                  coCode: mark.coCode,
                  marksObtained: mark.marksObtained,
                  maxMarks: mark.maxMarks,
                }
              });
            }
          }
        }

        await tx.cOPOMapping.deleteMany({ where: { subjectId } });
        if (parsedData.coPoMappings.length > 0) {
          await tx.cOPOMapping.createMany({
            data: parsedData.coPoMappings.map(m => ({
              subjectId,
              coCode: m.coCode,
              poCode: m.poCode,
              mappingValue: m.mappingValue
            }))
          });
        }

        await tx.surveyResponse.deleteMany({ where: { subjectId } });
        if (parsedData.surveyResponses.length > 0) {
          await tx.surveyResponse.createMany({
            data: parsedData.surveyResponses.map(s => ({
              subjectId,
              coCode: s.coCode,
              excellentCount: s.excellentCount,
              satisfactoryCount: s.satisfactoryCount,
              averageCount: s.averageCount,
              totalParticipants: s.totalParticipants
            }))
          });
        }

        await tx.uploadedFile.create({
          data: {
            subjectId,
            originalFilename: file.name,
            filePath: storagePath,
            uploadType: 'full_workbook',
            uploadedById: session.id,
          }
        });
      });

      return NextResponse.json({ message: 'Full workbook imported successfully', importedStudents: parsedData.students.length });
    }

    if (parsedObj.type === 'single_assessment') {
      const parsedData = parsedObj.data;
      const mappingRaw = formData.get('mapping');

      if (!mappingRaw) {
        return NextResponse.json({
          message: 'Preview loaded',
          type: 'single_assessment_preview',
          previewData: parsedData
        });
      }

      const mapping = JSON.parse(mappingRaw);
      const uploadResult = await uploadSubjectFile(storagePath, buffer, file.type || 'application/octet-stream');
      if (uploadResult.error) {
        throw uploadResult.error;
      }

      await db.$transaction(async (tx) => {
        for (const row of parsedData) {
          let dbStudent = await tx.student.findUnique({
            where: { regNumber_subjectId: { regNumber: row.regNumber, subjectId } }
          });

          if (!dbStudent) {
            dbStudent = await tx.student.create({
              data: { regNumber: row.regNumber, subjectId }
            });
          }

          for (const co of mapping.coCodes) {
            await tx.mark.upsert({
              where: {
                studentId_subjectId_assessmentId_coCode: {
                  studentId: dbStudent.id,
                  subjectId,
                  assessmentId: mapping.assessmentId,
                  coCode: co,
                }
              },
              update: {
                marksObtained: row.marksObtained,
                maxMarks: row.maxMarks,
              },
              create: {
                studentId: dbStudent.id,
                subjectId,
                assessmentId: mapping.assessmentId,
                coCode: co,
                marksObtained: row.marksObtained,
                maxMarks: row.maxMarks,
              }
            });
          }
        }

        await tx.uploadedFile.create({
          data: {
            subjectId,
            originalFilename: file.name,
            filePath: storagePath,
            uploadType: 'single_assessment',
            uploadedById: session.id,
          }
        });
      });

      return NextResponse.json({ message: 'Assessment imported successfully', importedCount: parsedData.length });
    }

    return NextResponse.json({ error: 'Unsupported import format' }, { status: 400 });
  } catch (error) {
    console.error('Error importing file:', error);
    return NextResponse.json({ error: error?.message || 'Import failed' }, { status: 500 });
  }
}
