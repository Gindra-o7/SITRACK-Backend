import { PrismaClient } from '@prisma/client';
import { UserProfile } from '../types/profile.types';

export class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getUserProfile(userId: string): Promise<UserProfile | null> {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    userRoles: {
                        include: {
                            role: true,
                        },
                    },
                    mahasiswa: true,
                    dosen: true,
                    pembimbingInstansi: true,
                },
            });

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                email: user.email,
                nama: user.nama,
                photoPath: user.photoPath || undefined,
                createdAt: user.createdAt,
                roles: user.userRoles.map(ur => ur.role.name),
                mahasiswa: user.mahasiswa ? {
                    nim: user.mahasiswa.nim,
                    noHp: user.mahasiswa.noHp || undefined,
                    semester: user.mahasiswa.semester || undefined,
                } : undefined,
                dosen: user.dosen ? {
                    nip: user.dosen.nip,
                    isPembimbing: user.dosen.isPembimbing,
                    isPenguji: user.dosen.isPenguji,
                    isKaprodi: user.dosen.isKaprodi,
                    isKoordinator: user.dosen.isKoordinator,
                } : undefined,
                pembimbingInstansi: user.pembimbingInstansi ? {
                    instansi: user.pembimbingInstansi.instansi,
                    jabatan: user.pembimbingInstansi.jabatan || undefined,
                    noTelpon: user.pembimbingInstansi.noTelpon || undefined,
                } : undefined,
            };
        } catch (error) {
            throw new Error('Failed to fetch user profile');
        }
    }
}
