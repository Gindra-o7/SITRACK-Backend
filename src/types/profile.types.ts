export interface UserProfile {
    id: string;
    email: string;
    nama: string;
    photoPath?: string;
    createdAt: Date;
    roles: string[];
    mahasiswa?: {
        nim: string;
        noHp?: string;
        semester?: number;
    };
    dosen?: {
        nip: string;
        isPembimbing: boolean;
        isPenguji: boolean;
        isKaprodi: boolean;
        isKoordinator: boolean;
    };
    pembimbingInstansi?: {
        instansi: string;
        jabatan?: string;
        noTelpon?: string;
    };
}