import { Router } from 'express';
import {
  listIncidents, createIncident, getIncident, updateIncident,
  assignIncident, addComment, dashboardStats
} from '../controllers/incidentController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(requireAuth);
router.get('/dashboard/stats', asyncHandler(dashboardStats));
router.get('/', asyncHandler(listIncidents));
router.post('/', asyncHandler(createIncident));
router.get('/:id', asyncHandler(getIncident));
router.patch('/:id', asyncHandler(updateIncident));
router.post('/:id/assign', allowRoles('admin'), asyncHandler(assignIncident));
router.post('/:id/comments', asyncHandler(addComment));
export default router;
