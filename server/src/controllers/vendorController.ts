import { Response, NextFunction } from 'express';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';
import { RequestWithEvent } from '../middleware/eventOwner';
import { Vendor } from '../types';

export class VendorController {
  public static async getVendors(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const vendors = db
        .prepare('SELECT * FROM vendors WHERE event_id = ? ORDER BY category ASC, company_name ASC')
        .all(eventId) as Vendor[];

      // Compute vendor summary statistics
      const totalEstimated = vendors.reduce((sum, v) => sum + (Number(v.estimated_cost) || 0), 0);
      const totalActual = vendors.reduce((sum, v) => sum + (Number(v.actual_cost) || 0), 0);
      const bookedCount = vendors.filter((v) => v.status === 'booked' || v.status === 'completed').length;

      res.status(200).json({
        success: true,
        data: {
          vendors,
          summary: {
            total_vendors: vendors.length,
            booked_vendors: bookedCount,
            total_estimated_cost: totalEstimated,
            total_actual_cost: totalActual,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createVendor(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const {
        category,
        company_name,
        contact_person,
        phone,
        email,
        estimated_cost,
        actual_cost,
        status,
        notes,
      } = req.body;

      const vendorId = `vnd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      db.prepare(`
        INSERT INTO vendors (
          id, event_id, category, company_name, contact_person, phone, email,
          estimated_cost, actual_cost, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        vendorId,
        eventId,
        category,
        company_name.trim(),
        contact_person?.trim() || null,
        phone?.trim() || null,
        email?.trim() || null,
        estimated_cost || 0,
        actual_cost || 0,
        status || 'inquiry',
        notes?.trim() || null
      );

      const created = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateVendor(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const vendorId = req.params.vendorId;
      const {
        category,
        company_name,
        contact_person,
        phone,
        email,
        estimated_cost,
        actual_cost,
        status,
        notes,
      } = req.body;

      const existing = db.prepare('SELECT id FROM vendors WHERE id = ? AND event_id = ?').get(vendorId, eventId);
      if (!existing) {
        throw new AppError('Vendor not found for this event', 404);
      }

      db.prepare(`
        UPDATE vendors SET
          category = COALESCE(?, category),
          company_name = COALESCE(?, company_name),
          contact_person = COALESCE(?, contact_person),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          estimated_cost = COALESCE(?, estimated_cost),
          actual_cost = COALESCE(?, actual_cost),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        category !== undefined ? category : null,
        company_name !== undefined ? company_name.trim() : null,
        contact_person !== undefined ? contact_person.trim() : null,
        phone !== undefined ? phone.trim() : null,
        email !== undefined ? email.trim() : null,
        estimated_cost !== undefined ? estimated_cost : null,
        actual_cost !== undefined ? actual_cost : null,
        status !== undefined ? status : null,
        notes !== undefined ? notes.trim() : null,
        vendorId
      );

      const updated = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendorId);

      res.status(200).json({
        success: true,
        message: 'Vendor updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteVendor(req: RequestWithEvent, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = req.params.eventId;
      const vendorId = req.params.vendorId;

      const existing = db.prepare('SELECT id FROM vendors WHERE id = ? AND event_id = ?').get(vendorId, eventId);
      if (!existing) {
        throw new AppError('Vendor not found for this event', 404);
      }

      db.prepare('DELETE FROM vendors WHERE id = ?').run(vendorId);

      res.status(200).json({
        success: true,
        message: 'Vendor deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
