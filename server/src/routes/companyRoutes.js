import express from 'express';
import { listCompanies, getCompanyById, createCompany, createCompanySchema } from '../controllers/companyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/rbacMiddleware.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, listCompanies);
router.get('/:id', authenticate, getCompanyById);
router.post('/', authenticate, authorizeRoles(ROLES.COMPANY_ADMIN), validate(createCompanySchema), createCompany);

export default router;
