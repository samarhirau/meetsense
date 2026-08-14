import { Router } from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect as any);

router.get('/', getTasks as any);
router.post('/', createTask as any);
router.put('/:id', updateTask as any);
router.delete('/:id', deleteTask as any);

export default router;
