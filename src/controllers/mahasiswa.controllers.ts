import { Request, Response } from 'express';
import {DokumenStatus, JenisDokumen, KategoriDokumen} from '@prisma/client';
import { uploadFile } from '../middlewares/fileUpload';
import { getRequiredDocuments } from "../utils/document.validation";
import prisma from "../configs/prisma.configs"

export class MahasiswaControllers {
    // Upload document handler
    async uploadDocument(req: Request, res: Response) {
        try {
            const { nim, userId, jenisDokumen, kategori } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const today = new Date().toISOString().split('T')[0];

            // Check for existing documents uploaded today
            const existingDocument = await prisma.dokumen.findFirst({
                where: {
                    nim,
                    kategori,
                    jenisDokumen,
                    tanggalUpload: {
                        gte: new Date(today)
                    }
                },
                include: {
                    history: true
                }
            });

            const filePath = await uploadFile(file);

            // Create new document or use existing one
            const document = await prisma.dokumen.upsert({
                where: {
                    id: existingDocument?.id ?? '',
                },
                create: {
                    nim,
                    userId,
                    jenisDokumen,
                    kategori,
                    filePath,
                    status: 'submitted',
                    history: {
                        create: {
                            nim,
                            userId,
                            jenisDokumen,
                            kategori,
                            filePath,
                            version: 1
                        }
                    }
                },
                update: {
                    filePath,
                    status: 'submitted',
                    history: {
                        create: {
                            nim,
                            userId,
                            jenisDokumen,
                            kategori,
                            filePath,
                            version: existingDocument ? existingDocument.history.length + 1 : 1
                        }
                    }
                },
                include: {
                    history: {
                        include: {
                            mahasiswa: true,
                            user: true
                        }
                    },
                    mahasiswa: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            return res.status(201).json(document);
        } catch (error) {
            console.error('Error uploading document:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getDocumentHistory(req: Request, res: Response) {
        try {
            const { nim, kategori } = req.params;

            // Get all documents grouped by submission date
            const documents = await prisma.dokumen.findMany({
                where: {
                    nim,
                    kategori: kategori as KategoriDokumen,
                },
                include: {
                    history: {
                        include: {
                            user: {
                                select: {
                                    nama: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: {
                            tanggalUpload: 'desc'
                        }
                    }
                }
            });

            // Group documents by submission date (YYYY-MM-DD)
            const groupedDocuments = documents.reduce((acc, doc) => {
                const date = new Date(doc.tanggalUpload).toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        documents: [],
                        status: 'menunggu' as const
                    };
                }
                acc[date].documents.push(doc);

                // Update group status based on document statuses
                if (doc.status === 'rejected') {
                    acc[date].status = 'revisi';
                } else if (doc.status === 'verified' && acc[date].status !== 'revisi') {
                    acc[date].status = 'diterima';
                }

                return acc;
            }, {} as Record<string, any>);

            // Convert to array and sort by date
            const result = Object.values(groupedDocuments).sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching document history:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get documents by stage
    async getDocumentsByStage(req: Request, res: Response) {
        try {
            const { nim, kategori } = req.params;

            const documents = await prisma.dokumen.findMany({
                where: {
                    nim,
                    kategori: kategori as KategoriDokumen,
                },
            });

            return res.status(200).json(documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Update MahasiswaKP registration data
    async updateRegistrationData(req: Request, res: Response) {
        try {
            const {
                nim,
                judulLaporan,
                namaInstansi,
                alamatInstansi,
                mulaiKp,
                selesaiKp,
                namaPembimbingInstansi,
                jabatanPembimbingInstansi,
                noTeleponPembimbing,
                emailPembimbingInstansi,
            } = req.body;

            // Validasi NIM
            if (!nim) {
                return res.status(400).json({ message: 'NIM is required' });
            }

            // Validasi required fields
            if (!judulLaporan || !namaInstansi || !alamatInstansi ||
                !mulaiKp || !selesaiKp || !namaPembimbingInstansi ||
                !noTeleponPembimbing || !emailPembimbingInstansi) {
                return res.status(400).json({
                    message: 'All fields are required'
                });
            }

            // Validasi format tanggal
            const mulaiKpDate = new Date(mulaiKp);
            const selesaiKpDate = new Date(selesaiKp);

            if (isNaN(mulaiKpDate.getTime()) || isNaN(selesaiKpDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid date format. Use YYYY-MM-DD format'
                });
            }

            const updatedData = await prisma.mahasiswaKp.upsert({
                where: { nim },
                update: {
                    judulLaporan,
                    namaInstansi,
                    alamatInstansi,
                    mulaiKp: mulaiKpDate,
                    selesaiKp: selesaiKpDate,
                    jabatanPembimbingInstansi,
                    namaPembimbingInstansi,
                    noTeleponPembimbing,
                    emailPembimbingInstansi,
                },
                create: {
                    nim,
                    judulLaporan,
                    namaInstansi,
                    alamatInstansi,
                    mulaiKp: mulaiKpDate,
                    selesaiKp: selesaiKpDate,
                    jabatanPembimbingInstansi,
                    namaPembimbingInstansi,
                    noTeleponPembimbing,
                    emailPembimbingInstansi,
                },
            });


            return res.status(200).json(updatedData);
        } catch (error) {
            console.error('Error updating registration data:', error);
            return res.status(500).json({
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Check if stage is complete
    async checkStageCompletion(req: Request, res: Response) {
        try {
            const { nim, kategori } = req.params;

            const documents = await prisma.dokumen.findMany({
                where: {
                    nim,
                    kategori: kategori as KategoriDokumen,
                },
            });

            const requiredDocs = getRequiredDocuments(kategori as KategoriDokumen);
            const isComplete = requiredDocs.every(docType =>
                documents.some(doc =>
                    doc.jenisDokumen === docType &&
                    doc.status === DokumenStatus.verified
                )
            );

            return res.status(200).json({ isComplete });
        } catch (error) {
            console.error('Error checking stage completion:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user.userId;
        console.log('userId from token:', userId);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nama: true,
                email: true,
                userRoles: {
                    include: {
                        role: true
                    }
                },
                mahasiswa: {
                    select: {
                        nim: true
                    }
                }
            }
        });
        console.log('found user:', user); // Debug user result

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        const err = error as Error; // Type assertion
        console.error('Error in getCurrentUser:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

interface DashboardResponse {
    currentStage: 'PERSYARATAN' | 'PENDAFTARAN' | 'PASCA_SEMINAR';
    documentsNeedingRevision: number;
    seminarSchedule: any | null;
    completedSteps: number;
    totalSteps: number;
}

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        // Get mahasiswa data with expanded seminar schedule information
        const mahasiswa = await prisma.mahasiswa.findFirst({
            where: { userId },
            include: {
                dokumen: {
                    where: {
                        status: 'rejected'
                    }
                },
                jadwalSeminar: {
                    where: {
                        status: {
                            in: ['pending', 'scheduled']
                        }
                    },
                    include: {
                        dosen: {
                            include: {
                                user: {
                                    select: {
                                        nama: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        tanggal: 'asc'
                    },
                    take: 1
                }
            }
        });

        if (!mahasiswa) {
            return res.status(404).json({ message: 'Mahasiswa not found' });
        }

        // Count documents by category to determine current stage
        const documentCounts = await prisma.dokumen.groupBy({
            by: ['kategori'],
            where: {
                nim: mahasiswa.nim,
                status: 'verified'
            },
            _count: true
        });

        // Determine current stage
        let currentStage: 'PERSYARATAN' | 'PENDAFTARAN' | 'PASCA_SEMINAR' = 'PERSYARATAN';
        let completedSteps = 0;

        const hasVerifiedPersyaratan = documentCounts.some(
            count => count.kategori === 'PERSYARATAN'
        );
        const hasVerifiedPendaftaran = documentCounts.some(
            count => count.kategori === 'PENDAFTARAN'
        );
        const hasVerifiedPascaSeminar = documentCounts.some(
            count => count.kategori === 'PASCA_SEMINAR'
        );

        if (hasVerifiedPascaSeminar) {
            currentStage = 'PASCA_SEMINAR';
            completedSteps = 3;
        } else if (hasVerifiedPendaftaran) {
            currentStage = 'PENDAFTARAN';
            completedSteps = 2;
        } else if (hasVerifiedPersyaratan) {
            currentStage = 'PENDAFTARAN';
            completedSteps = 1;
        }

        // Format seminar schedule with additional information
        const seminarSchedule = mahasiswa.jadwalSeminar[0]
            ? {
                id: mahasiswa.jadwalSeminar[0].id,
                tanggal: mahasiswa.jadwalSeminar[0].tanggal,
                waktuMulai: mahasiswa.jadwalSeminar[0].waktuMulai,
                waktuSelesai: mahasiswa.jadwalSeminar[0].waktuSelesai,
                ruangan: mahasiswa.jadwalSeminar[0].ruangan,
                status: mahasiswa.jadwalSeminar[0].status,
                dosenPenguji: {
                    nama: mahasiswa.jadwalSeminar[0].dosen.user.nama,
                    nip: mahasiswa.jadwalSeminar[0].dosen.nip
                }
            }
            : null;

        const response: DashboardResponse = {
            currentStage,
            documentsNeedingRevision: mahasiswa.dokumen.length,
            seminarSchedule,
            completedSteps,
            totalSteps: 3
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};