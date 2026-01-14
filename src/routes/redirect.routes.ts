import { Router } from 'express';
import * as linkController from '../controllers/link.controller';

const router = Router();

// Catch-all redirect route for shortened URLs
// This should be mounted at the root level
router.get('/:slug', linkController.redirect);

export default router;
