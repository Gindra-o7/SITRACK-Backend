import { PrismaClient } from '@prisma/client';
import { UpdateDocumentStatusDTO } from '../types/document.types';
import {ApiError} from "../utils/apiError";

export class DocumentService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getStudentsWithDocuments() {
        return this.prisma.mahasiswa.findMany({
            include: {
                user: true,
                dokumen: {
                    orderBy: { tanggalUpload: 'desc' }
                }
            }
        });
    }

    async updateDocumentStatus(id: string, userId: string, data: UpdateDocumentStatusDTO) {
        const document = await this.prisma.dokumen.findUnique({
            where: { id },
            include: { history: true }
        });

        if (!document) {
            throw new ApiError('Document not found', 404);
        }

        const [history, updatedDoc] = await this.prisma.$transaction([
            // Create document history
            this.prisma.dokumenHistory.create({
                data: {
                    dokumenId: document.id,
                    nim: document.nim,
                    userId: document.userId,
                    jenisDokumen: document.jenisDokumen,
                    kategori: document.kategori,
                    filePath: document.filePath,
                    version: (document.history.length || 0) + 1
                }
            }),
            // Update document status and comment
            this.prisma.dokumen.update({
                where: { id },
                data: {
                    status: data.status,
                    komentar: data.komentar || null  // Update komentar if provided, otherwise set to null
                }
            })
        ]);

        return {
            ...updatedDoc,
            history,
            message: `Document status updated to ${data.status}${data.komentar ? ' with comment' : ''}`
        };
    }
}