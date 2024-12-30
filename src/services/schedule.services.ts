import prisma from "../configs/prisma.configs";

export const getAllJadwal = async () => {
    return await prisma.jadwalSeminar.findMany({
        select: {
            id: true,
            tanggal: true,
            waktuMulai: true,
            waktuSelesai: true,
            ruangan: true,
            status: true,
            mahasiswa: {
                select: {
                    nim: true,
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
        }
    });
};
