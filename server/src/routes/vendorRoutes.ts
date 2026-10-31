import { Router } from 'express';
import { VendorController } from '../controllers/vendorController';
import { authenticate } from '../middleware/auth';
import { verifyEventOwnership } from '../middleware/eventOwner';
import { validate } from '../middleware/validate';
import { createVendorSchema, updateVendorSchema } from '../types';

export const vendorRouter = Router({ mergeParams: true });

vendorRouter.use(authenticate);
vendorRouter.use(verifyEventOwnership);

vendorRouter.get('/vendors', VendorController.getVendors);
vendorRouter.post('/vendors', validate(createVendorSchema), VendorController.createVendor);
vendorRouter.put('/vendors/:vendorId', validate(updateVendorSchema), VendorController.updateVendor);
vendorRouter.delete('/vendors/:vendorId', VendorController.deleteVendor);
