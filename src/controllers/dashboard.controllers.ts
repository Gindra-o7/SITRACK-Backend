import { Request, Response } from 'express';
import { PrismaClient, DokumenStatus, StatusSeminar } from '@prisma/client';
import { startOfSemester, endOfSemester } from '../utils/date.utils';

const prisma = new PrismaClient();

export class DashboardController {
    // Get dashboard statistics
    async getDashboardStats(req: Response, res: Response) {
        try {
            const currentDate = new Date();
            const semesterStart = startOfSemester(currentDate);
            const semesterEnd = endOfSemester(currentDate);

            // Get new submissions (last 7 days)
            const newSubmissions = await prisma.dokumen.count({
                where: {
                    tanggalUpload: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    },
                    kategori: 'PENDAFTARAN'
                }
            });

            // Get pending validations
            const pendingValidations = await prisma.dokumen.count({
                where: {
                    status: 'submitted'
                }
            });

            // Get seminars this semester
            const seminarCount = await prisma.jadwalSeminar.count({
                where: {
                    tanggal: {
                        gte: semesterStart,
                        lte: semesterEnd
                    }
                }
            });

            // Get total registered students (changed from active students)
            const totalStudents = await prisma.mahasiswa.count();

            // Get documents needing validation today
            const todayValidations = await prisma.dokumen.count({
                where: {
                    status: 'submitted',
                    tanggalUpload: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            return res.status(200).json({
                stats: {
                    newSubmissions,
                    pendingValidations,
                    seminarCount,
                    totalStudents // renamed from activeStudents
                },
                alert: {
                    needsValidation: todayValidations
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}