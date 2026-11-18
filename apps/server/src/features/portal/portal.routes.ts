import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { show } from './portal.controller.js';

export const router = Router();
router.get('/', asyncHandler(show));
