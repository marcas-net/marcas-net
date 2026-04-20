import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getFormTemplates, getFormTemplate, createFormTemplate, updateFormTemplate, deleteFormTemplate,
  getFormEntries, createFormEntry, updateFormEntry, deleteFormEntry,
} from '../controllers/forms';

const router = express.Router();

// Templates
router.get('/templates', authenticateToken, getFormTemplates);
router.get('/templates/:id', authenticateToken, getFormTemplate);
router.post('/templates', authenticateToken, createFormTemplate);
router.put('/templates/:id', authenticateToken, updateFormTemplate);
router.delete('/templates/:id', authenticateToken, deleteFormTemplate);

// Entries
router.get('/entries', authenticateToken, getFormEntries);
router.post('/entries', authenticateToken, createFormEntry);
router.put('/entries/:id', authenticateToken, updateFormEntry);
router.delete('/entries/:id', authenticateToken, deleteFormEntry);

export default router;
