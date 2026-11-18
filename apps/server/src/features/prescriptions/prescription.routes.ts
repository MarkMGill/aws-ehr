import { Router } from 'express';
import { asyncHandler } from '../../middleware/async-handler.js';
import { list } from './prescription.controller.js';

// Mounted behind the shared authentication/role boundary in app.ts.
export const router = Router();
router.get('/', asyncHandler(list));
