import { Router } from 'express';
import { getLiveEnvironment,getPredictionHistory } from '../controllers/environmentController.js';
const router=Router(); router.get('/live',getLiveEnvironment); router.get('/history',getPredictionHistory); export default router;
