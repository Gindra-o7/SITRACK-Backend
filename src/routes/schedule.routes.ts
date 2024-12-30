import { Router } from 'express';
import { getJadwalSeminar } from '../controllers/schedule.controllers';

const router = Router();

router.get('/jadwal', getJadwalSeminar);

export default router;