import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  X,
  Building,
} from 'lucide-react';
import {
  Vendor,
  VendorSummary,
  VENDOR_CATEGORIES,
  VendorCategory,
  VENDOR_STATUSES,
  VendorStatus,
} from '../../types';
import { vendorService } from '../../services/vendorService';
import { useEvent } from '../../context/EventContext';

export const VendorView: React.FC = () => {
  const { activeEvent, refreshActiveEvent, refreshEvents } = useEvent();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [summary, setSummary] = useState<VendorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('Venue');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [actualCost, setActualCost] = useState<number>(0);
  const [status, setStatus] = useState<VendorStatus>('inquiry');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadVendors = async () => {
    if (!activeEvent) return;
    try {
      setLoading(true);
      const res = await vendorService.getVendors(activeEvent.id);
      setVendors(res.data.vendors);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, [activeEvent]);

  if (!activeEvent) {
    return (
      <div className="card empty-state">
        <Users size={40} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
        <h3 className="empty-state-title">Select or Create an Event First</h3>
        <p className="empty-state-desc">
          Choose an active celebration to manage vendors, track quotes, and record contracts.
        </p>
      </div>
    );
  }

  const handleOpenModal = (vendor?: Vendor) => {
    setFormError(null);
    if (vendor) {
      setEditingVendor(vendor);
      setCompanyName(vendor.company_name);
      setCategory(vendor.category);
      setContactPerson(vendor.contact_person || '');
      setPhone(vendor.phone || '');
      setEmail(vendor.email || '');
      setEstimatedCost(vendor.estimated_cost);
      setActualCost(vendor.actual_cost);
      setStatus(vendor.status);
      setNotes(vendor.notes || '');
    } else {
      setEditingVendor(null);
      setCompanyName('');
      setCategory('Venue');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setEstimatedCost(0);
      setActualCost(0);
      setStatus('inquiry');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim()) {
      setFormError('Company or service provider name is required');
      return;
    }

    try {
      const payload = {
        company_name: companyName.trim(),
        category,
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        estimated_cost: Number(estimatedCost),
        actual_cost: Number(actualCost),
        status,
        notes: notes.trim() || undefined,
      };

      if (editingVendor) {
        await vendorService.updateVendor(activeEvent.id, editingVendor.id, payload);
      } else {
        await vendorService.createVendor(activeEvent.id, payload);
      }

      setIsModalOpen(false);
      await loadVendors();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!window.confirm('Delete this vendor record?')) return;
    try {
      await vendorService.deleteVendor(activeEvent.id, vendorId);
      await loadVendors();
      await refreshActiveEvent();
      await refreshEvents();
    } catch (err) {
      console.error('Failed to delete vendor:', err);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    if (!categoryFilter) return true;
    return v.category === categoryFilter;
  });

  return (
    <div>
      {/* Vendor Stats KPI Banner */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Partners Tracked</div>
            <div className="stat-value">{summary?.total_vendors || 0}</div>
            <div className="stat-subtext">Across {VENDOR_CATEGORIES.length} service categories</div>
          </div>
          <div className="stat-icon stat-icon-blue">
            <Building size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Contracts Locked / Booked</div>
            <div className="stat-value">{summary?.booked_vendors || 0}</div>
            <div className="stat-subtext">
              {summary && summary.total_vendors > 0
                ? `${Math.round((summary.booked_vendors / summary.total_vendors) * 100)}% finalized`
                : '0%'}
            </div>
          </div>
          <div className="stat-icon stat-icon-green">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Estimated Benchmark Costs</div>
            <div className="stat-value">₹{(summary?.total_estimated_cost || 0).toLocaleString()}</div>
            <div className="stat-subtext">Planning benchmarks</div>
          </div>
          <div className="stat-icon stat-icon-blue">
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Agreed Quoted Costs</div>
            <div className="stat-value">₹{(summary?.total_actual_cost || 0).toLocaleString()}</div>
            <div className="stat-subtext">Sum of actual agreed quotes</div>
          </div>
          <div className="stat-icon stat-icon-amber">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Accuracy & Security Transparency Disclaimer */}
      <div className="alert alert-info" style={{ marginBottom: '24px' }}>
        <Info size={18} color="var(--primary-700)" />
        <span style={{ fontSize: '0.8125rem' }}>
          <strong>Transparency Notice:</strong> CelebraPlan AI provides realistic financial benchmark estimates and vetting criteria. We do not fabricate fake business phone numbers or unverified availability. You can enter and track real local vendor contacts and negotiated quotes below.
        </span>
      </div>

      {/* Vendor Directory & Cards */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">
            <Users size={20} color="var(--primary-600)" />
            <span>Vendor Directory & Service Providers</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8125rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter vendors by category"
            >
              <option value="">All Categories</option>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => handleOpenModal()}
            >
              <Plus size={16} />
              <span>Add Vendor</span>
            </button>
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate-500)' }}>
            <p>No vendors listed for this filter. Use the AI Planner to populate benchmark specifications or click "Add Vendor" to record your partner.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredVendors.map((vendor) => {
              const isBooked = vendor.status === 'booked' || vendor.status === 'completed';
              return (
                <div
                  key={vendor.id}
                  style={{
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    backgroundColor: isBooked ? 'var(--primary-50)' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-info">{vendor.category}</span>
                      <span
                        className={`badge ${
                          vendor.status === 'booked' || vendor.status === 'completed'
                            ? 'badge-success'
                            : vendor.status === 'quoted' || vendor.status === 'contract_sent'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {vendor.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '4px' }}>
                      {vendor.company_name}
                    </h4>

                    {vendor.contact_person && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '6px' }}>
                        Contact: {vendor.contact_person}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', color: 'var(--slate-600)', margin: '8px 0' }}>
                      {vendor.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} color="var(--slate-400)" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} color="var(--slate-400)" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                    </div>

                    {vendor.notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', margin: '8px 0', background: 'var(--slate-100)', padding: '6px 8px', borderRadius: '4px' }}>
                        {vendor.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--slate-200)', paddingTop: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        Est: ₹{vendor.estimated_cost.toLocaleString()}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--slate-900)' }}>
                        Agreed: ₹{vendor.actual_cost.toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenModal(vendor)}
                        title="Edit vendor"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleDeleteVendor(vendor.id)}
                        title="Delete vendor"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vendor-modal-title">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 id="vendor-modal-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                {editingVendor ? 'Edit Vendor Details' : 'Add New Vendor'}
              </h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVendor}>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" style={{ marginBottom: '14px' }}>
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="vendor-company">
                    Company / Vendor Name <span style={{ color: 'var(--danger-500)' }}>*</span>
                  </label>
                  <input
                    id="vendor-company"
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Dreamscape Wedding Photography"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-category">
                      Category
                    </label>
                    <select
                      id="vendor-category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as VendorCategory)}
                    >
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-status">
                      Booking Status
                    </label>
                    <select
                      id="vendor-status"
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as VendorStatus)}
                    >
                      {VENDOR_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-contact">
                      Contact Person
                    </label>
                    <input
                      id="vendor-contact"
                      type="text"
                      className="form-input"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-phone">
                      Phone Number
                    </label>
                    <input
                      id="vendor-phone"
                      type="tel"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vendor-email">
                    Email Address
                  </label>
                  <input
                    id="vendor-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@studio.com"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-est-cost">
                      Estimated Benchmark (₹)
                    </label>
                    <input
                      id="vendor-est-cost"
                      type="number"
                      min="0"
                      className="form-input"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="vendor-act-cost">
                      Agreed Quoted Cost (₹)
                    </label>
                    <input
                      id="vendor-act-cost"
                      type="number"
                      min="0"
                      className="form-input"
                      value={actualCost}
                      onChange={(e) => setActualCost(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vendor-notes">
                    Notes & Deliverables Scope
                  </label>
                  <textarea
                    id="vendor-notes"
                    className="form-textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Deliverables, payment milestones, cancellation policy..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingVendor ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
