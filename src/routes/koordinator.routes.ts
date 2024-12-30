import express from 'express';
import {KoordinatorController, getCurrentUser} from "../controllers/koordinator.controllers"
import {authenticateToken, authorizeRoles} from "../middlewares/auth.middlewares"
import {JadwalController} from "../controllers/jadwal.controllers"
import {DocumentController} from "../controllers/document.controllers"
import {NilaiController} from "../controllers/nilai.controllers"
import {DashboardController} from "../controllers/dashboard.controllers"

const router = express.Router();

const koordinatorController = new KoordinatorController();
const jadwalController = new JadwalController();
const documentController = new DocumentController();
const nilaiController = new NilaiController();
const dashboardController = new DashboardController();

router.post(
    "/koordinator/user",
    authenticateToken,
    authorizeRoles(['koordinator']),
    koordinatorController.register,
);

router.get(
    "/koordinator/users",
    authenticateToken,
    authorizeRoles(['koordinator']),
    koordinatorController.getUsers
);

router.get(
    "/koordinator/me",
    authenticateToken,
    authorizeRoles(['koordinator']),
    getCurrentUser
)

router.get(
    "/koordinator/mahasiswa",
    authenticateToken,
    authorizeRoles(['koordinator']),
    koordinatorController.getAllStudentsWithFiles
)

router.get(
    "/koordinator/dokumen/:nim",
    authenticateToken,
    authorizeRoles(['koordinator']),
    koordinatorController.getDokumenByNim
)

router.get(
    "/koordinator/:id/status",
    authenticateToken,
    authorizeRoles(['koordinator']),
    koordinatorController.updateStatus
)

router.post(
    "/koordinator/jadwal",
    authenticateToken,
    authorizeRoles(['koordinator']),
    jadwalController.createJadwal
)

router.get(
    "/koordinator/jadwal-mahasiswa",
    authenticateToken,
    authorizeRoles(['koordinator']),
    jadwalController.getMahasiswa
)

router.get(
    "/koordinator/jadwal/dosen-penguji",
    authenticateToken,
    authorizeRoles(['koordinator']),
    jadwalController.getDosenPenguji
)

router.get(
    "/koordinator/check-dosen-availability",
    authenticateToken,
    authorizeRoles(['koordinator']),
    jadwalController.checkDosenAvailability
)

router.get(
    "/koordinator/jadwal",
    authenticateToken,
    authorizeRoles(['koordinator']),
    jadwalController.getAllJadwal
)

router.get(
    "/koordinator/mahasiswa-document",
    authenticateToken,
    authorizeRoles(['koordinator']),
    documentController.getStudents
)

router.patch(
    "/koordinator/document/:id/status",
    authenticateToken,
    authorizeRoles(['koordinator']),
    documentController.updateStatus
)

router.get(
    '/koordinator/nilai',
    authenticateToken,
    authorizeRoles(['koordinator']),
    nilaiController.getNilaiList
);

router.post(
    '/koordinator/nilai',
    authenticateToken,
    authorizeRoles(['koordinator']),
    nilaiController.createNilai
);

router.put(
    '/koordinator/nilai/:id',
    authenticateToken,
    authorizeRoles(['koordinator']),
    nilaiController.updateNilai
);

router.get(
    '/nilai/:id',
    authenticateToken,
    authorizeRoles(['koordinator']),
    nilaiController.getNilaiById
);

router.get(
    "/koordinator/stats",
    authenticateToken,
    authorizeRoles(['koordinator']),
    dashboardController.getDashboardStats
)

export default router;