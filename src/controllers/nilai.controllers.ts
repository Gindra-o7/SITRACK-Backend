import { Request, Response } from 'express';
import prisma from "../configs/prisma.configs"
import { calculateFinalGrade } from '../utils/gradeCalculator';

export class NilaiController {
    async getNilaiList(req: Request, res: Response) {
        try {
            const nilaiList = await prisma.nilai.findMany({
                include: {
                    jadwalSeminar: {
                        include: {
                            mahasiswa: {
                                include: {
                                    mahasiswaKp: true,
                                    user: true
                                }
                            }
                        }
                    },
                    dosenPembimbing: {
                        include: {
                            user: true
                        }
                    },
                    dosenPenguji: {
                        include: {
                            user: true
                        }
                    },
                    pembimbingInstansi: {
                        include: {
                            user: true
                        }
                    }
                }
            });

            const formattedNilaiList = nilaiList.map(nilai => {
                // Calculate final grade with existing values
                const calculatedNilaiAkhir = calculateFinalGrade({
                    nilaiPembimbing: nilai.nilaiPembimbing || 0,
                    nilaiPenguji: nilai.nilaiPenguji || 0,
                    nilaiPembimbingInstansi: nilai.nilaiPembimbingInstansi || 0
                });

                return {
                    id: nilai.id,
                    // Add null checks for nested properties
                    mahasiswa: nilai.jadwalSeminar?.mahasiswa?.user?.nama || 'Tidak Ada Data',
                    nim: nilai.jadwalSeminar?.mahasiswa?.nim || nilai.nim,
                    judul: nilai.jadwalSeminar?.mahasiswa?.mahasiswaKp?.judulLaporan || '-',
                    pembimbing: nilai.nilaiPembimbing || 0,
                    penguji: nilai.nilaiPenguji || 0,
                    pembimbingInstansi: nilai.nilaiPembimbingInstansi || 0,
                    nilaiAkhir: nilai.nilaiAkhir || calculatedNilaiAkhir,
                    isFinalized: nilai.isFinalized,
                    // Optional: Add additional info about related entities
                    dosenPembimbing: nilai.dosenPembimbing?.user?.nama || 'Belum Ditentukan',
                    dosenPenguji: nilai.dosenPenguji?.user?.nama || 'Belum Ditentukan',
                    pembimbingInstansiNama: nilai.pembimbingInstansi?.user?.nama || 'Belum Ditentukan'
                };
            });

            res.json(formattedNilaiList);
        } catch (error) {
            console.error('Error fetching nilai:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            });
        }
    }

    async createNilai(req: Request, res: Response) {
        try {
            const { jadwalSeminarId, nilaiPembimbing, nilaiPenguji, nilaiPembimbingInstansi, dosenPembimbingId, dosenPengujiId, pembimbingInstansiId, nim } = req.body;

            const nilaiAkhir = calculateFinalGrade({
                nilaiPembimbing,
                nilaiPenguji,
                nilaiPembimbingInstansi
            });

            const nilai = await prisma.nilai.create({
                data: {
                    jadwalSeminarId,
                    nilaiPembimbing,
                    nilaiPenguji,
                    nilaiPembimbingInstansi,
                    dosenPembimbingId,
                    dosenPengujiId,
                    pembimbingInstansiId,
                    nilaiAkhir,
                    nim
                }
            });

            res.json(nilai);
        } catch (error) {
            console.error('Error creating nilai:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateNilai(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { nilaiPembimbing, nilaiPenguji, nilaiPembimbingInstansi } = req.body;

            const nilaiAkhir = calculateFinalGrade({
                nilaiPembimbing,
                nilaiPenguji,
                nilaiPembimbingInstansi
            });

            const nilai = await prisma.nilai.update({
                where: { id },
                data: {
                    nilaiPembimbing,
                    nilaiPenguji,
                    nilaiPembimbingInstansi,
                    nilaiAkhir
                }
            });

            res.json(nilai);
        } catch (error) {
            console.error('Error updating nilai:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getNilaiById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const nilai = await prisma.nilai.findUnique({
                where: { id },
                include: {
                    jadwalSeminar: {
                        include: {
                            mahasiswa: {
                                include: {
                                    mahasiswaKp: true,
                                    user: true
                                }
                            }
                        }
                    }
                }
            });

            if (!nilai) {
                return res.status(404).json({ error: 'Nilai not found' });
            }

            res.json(nilai);
        } catch (error) {
            console.error('Error fetching nilai:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

