import { Request, Response } from 'express';
import { getAllJadwal } from '../services/schedule.services';

export const getJadwalSeminar = async (req: Request, res: Response) => {
    try {
        const jadwal = await getAllJadwal();
        res.status(200).json(jadwal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch jadwal seminar.' });
    }
};
