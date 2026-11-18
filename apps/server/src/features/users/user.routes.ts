import { Router } from 'express';
import { me } from './user.controller.js';

export const router = Router();
router.get('/me', me);
