import {RegisterInput} from "../types/user.types";
import bcrypt from "bcrypt";
import prisma from "../configs/prisma.configs";
import {DokumenStatus} from "@prisma/client";

export class KoordinatorServices {
    async register(input: RegisterInput) {
        const hashedPassword = await bcrypt.hash(input.password, 10);

        return prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    email: input.email,
                    nama: input.nama,
                    password: hashedPassword,
                },
            });

            // Find all requested roles
            const roles = await tx.role.findMany({
                where: {
                    name: {
                        in: input.roles
                    }
                }
            });

            if (roles.length !== input.roles.length) {
                throw new Error('Some roles were not found');
            }

            // Create UserRoles
            await Promise.all(roles.map(role =>
                tx.userRole.create({
                    data: {
                        userId: user.id,
                        roleId: role.id,
                    },
                })
            ));

            // Handle special role requirements
            if (input.roles.some(role => ['dosen_pembimbing', 'dosen_penguji', 'kaprodi', 'koordinator'].includes(role))) {
                if (!input.nip) {
                    throw new Error('NIP is required for dosen roles');
                }

                const existingDosen = await tx.dosen.findUnique({
                    where: { nip: input.nip },
                });

                if (existingDosen) {
                    throw new Error('NIP already exists');
                }

                await tx.dosen.create({
                    data: {
                        userId: user.id,
                        nip: input.nip,
                        isPembimbing: input.roles.includes('dosen_pembimbing'),
                        isPenguji: input.roles.includes('dosen_penguji'),
                        isKaprodi: input.roles.includes('kaprodi'),
                        isKoordinator: input.roles.includes('koordinator'),
                    },
                });
            }

            if (input.roles.includes('pembimbing_instansi')) {
                const existingPembimbingInstansi = await tx.pembimbingInstansi.findUnique({
                    where: { userId: user.id },
                });
                if (existingPembimbingInstansi) {
                    throw new Error('account already exists for this user');
                }

                await tx.pembimbingInstansi.create({
                    data: {
                        userId: user.id,
                        instansi: '',
                        jabatan: '',
                        noTelpon: '',
                    },
                });
            }

            return user;
        });
    }

    async getDokumenByNim(nim: string) {
        return prisma.dokumen.findMany({
            where: { nim },
            include: {
                mahasiswa: {
                    include: { mahasiswaKp: true }
                }
            }
        });
    }

    async updateDokumenStatus(id: string, status: DokumenStatus, koordinatorId: string, komentar?: string) {
        const dokumen = await prisma.dokumen.findUnique({ where: { id } });

        if (!dokumen) throw new Error('Dokumen not found');

        const history = await prisma.dokumenHistory.create({
            data: {
                dokumenId: dokumen.id,
                nim: dokumen.nim,
                userId: dokumen.userId,
                jenisDokumen: dokumen.jenisDokumen,
                kategori: dokumen.kategori,
                filePath: dokumen.filePath,
            }
        });

        return prisma.dokumen.update({
            where: { id },
            data: { status }
        });
    }
}