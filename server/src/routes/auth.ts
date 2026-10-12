import { Router } from 'express';
import { login, getMe, getSeedStatus, triggerSeed } from '../controllers/auth';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/seed-status', getSeedStatus);
router.post('/seed', triggerSeed);

export default router;
