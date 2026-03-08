import {Router} from 'express';
import * as linkController from '../controllers/link.controller';

const router = Router();

router.get('/', linkController.redirectSubdomain);
router.get('/:slug', linkController.redirect);

export default router;
