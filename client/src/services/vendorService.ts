import { apiRequest } from './api';
import { Vendor, VendorSummary } from '../types';

export interface VendorListResponse {
  success: boolean;
  data: {
    vendors: Vendor[];
    summary: VendorSummary;
  };
}

export const vendorService = {
  async getVendors(eventId: string): Promise<VendorListResponse> {
    return apiRequest<VendorListResponse>(`/events/${eventId}/vendors/vendors`);
  },

  async createVendor(
    eventId: string,
    vendor: Partial<Vendor>
  ): Promise<{ success: boolean; data: Vendor; message: string }> {
    return apiRequest<{ success: boolean; data: Vendor; message: string }>(`/events/${eventId}/vendors/vendors`, {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  },

  async updateVendor(
    eventId: string,
    vendorId: string,
    vendor: Partial<Vendor>
  ): Promise<{ success: boolean; data: Vendor; message: string }> {
    return apiRequest<{ success: boolean; data: Vendor; message: string }>(
      `/events/${eventId}/vendors/vendors/${vendorId}`,
      {
        method: 'PUT',
        body: JSON.stringify(vendor),
      }
    );
  },

  async deleteVendor(eventId: string, vendorId: string): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(`/events/${eventId}/vendors/vendors/${vendorId}`, {
      method: 'DELETE',
    });
  },
};
