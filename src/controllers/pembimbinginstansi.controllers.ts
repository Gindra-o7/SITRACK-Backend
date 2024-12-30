import {Request, Response} from "express";
import prisma from "../configs/prisma.configs";
import { PembimbingInstansiService } from '../services/pembimbingInstansi.services';
import { ApiError } from '../utils/apiError';

interface InputNilaiRequest extends Request {
    body: {
        nilai: number;
    };
    params: {
        nim: string;
    };
    user?: {
        id: string;
    };
}

export class PembimbingInstansiController {
    private service: PembimbingInstansiService;

    constructor() {
        this.service = new PembimbingInstansiService();
    }

    getProfile = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            const profile = await this.service.getProfile(userId);
            res.json(profile);
        } catch (error) {
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    getStudents = async (req: Request, res: Response) => {
        try {
            const pembimbingId = req.user?.id;
            const students = await this.service.getStudents(pembimbingId);
            res.json(students);
        } catch (error) {
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    getNilaiMahasiswa = async (req: Request, res: Response) => {
        try {
            const { nim } = req.params;
            const pembimbingId = req.user?.id;
            const nilai = await this.service.getNilaiMahasiswa(pembimbingId, nim);
            res.json(nilai);
        } catch (error) {
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };

    inputNilai = async (req: InputNilaiRequest, res: Response) => {
        try {
            const { nim } = req.params;
            const { nilai } = req.body;
            const pembimbingId = req.user?.id;

            if (!pembimbingId) {
                throw new ApiError('Unauthorized', 401);
            }

            const result = await this.service.inputNilai(pembimbingId, nim, nilai);
            res.json(result);
        } catch (error) {
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                console.error('Error in inputNilai:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    };
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