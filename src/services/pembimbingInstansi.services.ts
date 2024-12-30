import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';

export class PembimbingInstansiService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.pembimbingInstansi.findFirst({
            where: { userId },
            include: {
                user: {
                    select: {
                        nama: true,
                        email: true,
                        userRoles: {
                            include: {
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!profile) {
            throw new ApiError('Profile not found', 404);
        }

        return profile;
    }

    async getStudents(pembimbingId: string) {
        const students = await this.prisma.mahasiswaKp.findMany({
            where: {
                pembimbingInstansiId: pembimbingId
            },
            include: {
                mahasiswa: {
                    include: {
                        user: {
                            select: {
                                nama: true,
                                email: true
                            }
                        },
                        jadwalSeminar: {
                            where: {
                                status: 'completed'
                            },
                            take: 1,
                            orderBy: {
                                tanggal: 'desc'
                            }
                        }
                    }
                }
            }
        });

        return students.map(student => ({
            nim: student.nim,
            name: student.mahasiswa?.user.nama,
            startDate: student.mulaiKp,
            endDate: student.selesaiKp,
            projectTitle: student.judulLaporan,
            seminarDate: student.mahasiswa?.jadwalSeminar[0]?.tanggal,
            status: student.selesaiKp && new Date() > new Date(student.selesaiKp) ? 'Selesai' : 'Aktif'
        }));
    }

    async getNilaiMahasiswa(pembimbingId: string, nim: string) {
        const nilai = await this.prisma.nilai.findFirst({
            where: {
                nim,
                pembimbingInstansiId: pembimbingId
            },
            include: {
                mahasiswa: {
                    include: {
                        user: {
                            select: {
                                nama: true
                            }
                        }
                    }
                },
                jadwalSeminar: true
            }
        });

        if (!nilai) {
            throw new ApiError('Nilai not found', 404);
        }

        return nilai;
    }

    async inputNilai(pembimbingId: string, nim: string, nilaiInput: number) {
        // Validate if the student belongs to this supervisor
        const mahasiswaKp = await this.prisma.mahasiswaKp.findFirst({
            where: {
                nim,
                pembimbingInstansiId: pembimbingId
            },
            include: {
                mahasiswa: true
            }
        });

        if (!mahasiswaKp) {
            throw new ApiError('Student not found or not assigned to this supervisor', 404);
        }

        // Check if nilai already exists for this student and supervisor
        const existingNilai = await this.prisma.nilai.findFirst({
            where: {
                nim,
                pembimbingInstansiId: pembimbingId,
            }
        });

        if (existingNilai) {
            // Update existing nilai
            const updatedNilai = await this.prisma.nilai.update({
                where: {
                    id: existingNilai.id
                },
                data: {
                    nilaiPembimbingInstansi: nilaiInput,
                    updatedAt: new Date()
                }
            });
            return updatedNilai;
        }

        // Create new nilai if it doesn't exist
        const newNilai = await this.prisma.nilai.create({
            data: {
                nim,
                nilaiPembimbingInstansi: nilaiInput,
                pembimbingInstansiId: pembimbingId,
                jadwalSeminarId: null as any, // Since jadwalSeminarId is required in schema but we don't need it here
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        return newNilai;
    }
}