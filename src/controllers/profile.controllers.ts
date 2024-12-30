import {Request, Response} from 'express';
import {UserService} from '../services/profile.services';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.userId;

            if (!userId) {
                res.status(400).json({error: 'User ID is required'});
                return;
            }

            const userProfile = await this.userService.getUserProfile(userId);

            if (!userProfile) {
                res.status(404).json({error: 'User not found'});
                return;
            }

            res.json(userProfile);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).json({error: 'Internal server error'});
        }
    };
}