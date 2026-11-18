import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { show } from './dashboard.controller.js';

export const router = Router();
router.get('/', asyncHandler(show));
