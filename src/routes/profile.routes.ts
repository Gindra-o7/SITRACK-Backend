import { Router } from 'express';
import { UserController } from '../controllers/profile.controllers';
import {authenticateToken} from "../middlewares/auth.middlewares";

const router = Router();
const userController = new UserController();

router.get(
    '/profile/:userId',
    authenticateToken,
    userController.getProfile
);


export default router;