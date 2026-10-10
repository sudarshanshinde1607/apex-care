import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Droplets, Plus, Users, Package, AlertTriangle } from 'lucide-react';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodGroupColors: Record<string, string> = {
  'A+': 'bg-red-100 text-red-700',
  'A-': 'bg-red-200 text-red-800',
  'B+': 'bg-orange-100 text-orange-700',
  'B-': 'bg-orange-200 text-orange-800',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-purple-200 text-purple-800',
  'O+': 'bg-blue-100 text-blue-700',
  'O-': 'bg-blue-200 text-blue-800',
};

// Mock blood bank data (stored client-side for demo)
const initialInventory = [
  { bloodGroup: 'A+', units: 12, minRequired: 5 },
  { bloodGroup: 'A-', units: 3, minRequired: 3 },
  { bloodGroup: 'B+', units: 8, minRequired: 5 },
  { bloodGroup: 'B-', units: 2, minRequired: 3 },
  { bloodGroup: 'AB+', units: 5, minRequired: 3 },
  { bloodGroup: 'AB-', units: 1, minRequired: 2 },
  { bloodGroup: 'O+', units: 15, minRequired: 8 },
  { bloodGroup: 'O-', units: 4, minRequired: 5 },
];

const initialDonors = [
  { id: '1', name: 'Ramesh Kumar', bloodGroup: 'O+', lastDonation: '2026-09-15', phone: '9876543210' },
  { id: '2', name: 'Priya Sharma', bloodGroup: 'A+', lastDonation: '2026-08-20', phone: '9876543211' },
  { id: '3', name: 'Anil Patel', bloodGroup: 'B-', lastDonation: '2026-10-01', phone: '9876543212' },
  { id: '4', name: 'Sunita Verma', bloodGroup: 'AB+', lastDonation: '2026-07-10', phone: '9876543213' },
];

const initialTransfusions = [
  { id: '1', patientName: 'Frank Green', bloodGroup: 'O+', units: 2, date: '2026-10-05', status: 'COMPLETED' },
  { id: '2', patientName: 'Aisha Singh', bloodGroup: 'A+', units: 1, date: '2026-10-07', status: 'COMPLETED' },
  { id: '3', patientName: 'Mohan Pillai', bloodGroup: 'B+', units: 2, date: '2026-10-09', status: 'PENDING' },
];

export const BloodBank: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'donors' | 'transfusions'>('inventory');
  const [inventory, setInventory] = useState(initialInventory);
  const [donors] = useState(initialDonors);
  const [transfusions] = useState(initialTransfusions);
  const [showAddDonation, setShowAddDonation] = useState(false);
  const [donationForm, setDonationForm] = useState({ bloodGroup: 'O+', units: 1 });

  const lowStock = inventory.filter(b => b.units < b.minRequired);

  const handleAddUnits = () => {
    setInventory(prev =>
      prev.map(b =>
        b.bloodGroup === donationForm.bloodGroup
          ? { ...b, units: b.units + Number(donationForm.units) }
          : b
      )
    );
    setShowAddDonation(false);
  };

  const tabs = [
    { id: 'inventory', label: 'Blood Inventory', icon: Package },
    { id: 'donors', label: 'Donors', icon: Users },
    { id: 'transfusions', label: 'Transfusion Log', icon: Droplets },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blood Bank</h1>
          <p className="text-muted-foreground mt-1">Manage blood inventory, donors, and transfusion records.</p>
        </div>
        <button
          onClick={() => setShowAddDonation(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Donation
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Low Stock Alert</p>
            <p className="text-sm text-muted-foreground mt-1">
              Blood groups below minimum: {lowStock.map(b => `${b.bloodGroup} (${b.units} units)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Inventory Grid */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {inventory.map(item => (
            <div
              key={item.bloodGroup}
              className={`rounded-xl border p-5 text-center shadow-sm ${
                item.units < item.minRequired ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'
              }`}
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold mb-3 ${bloodGroupColors[item.bloodGroup]}`}>
                {item.bloodGroup}
              </div>
              <p className="text-3xl font-bold text-foreground">{item.units}</p>
              <p className="text-xs text-muted-foreground mt-1">Units Available</p>
              {item.units < item.minRequired && (
                <p className="text-xs text-destructive mt-2 font-medium">⚠ Low Stock</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Donors Table */}
      {activeTab === 'donors' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Donor Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Blood Group</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Donation</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Phone</th>
              </tr>
            </thead>
            <tbody>
              {donors.map(d => (
                <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{d.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${bloodGroupColors[d.bloodGroup]}`}>
                      {d.bloodGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{d.lastDonation}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Transfusions */}
      {activeTab === 'transfusions' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Blood Group</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Units</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {transfusions.map(t => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{t.patientName}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${bloodGroupColors[t.bloodGroup]}`}>
                      {t.bloodGroup}
                    </span>
                  </td>
                  <td className="py-3 px-4">{t.units}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Donation Modal */}
      {showAddDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm border border-border">
            <h2 className="text-lg font-semibold mb-4">Record Blood Donation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Blood Group</label>
                <select
                  value={donationForm.bloodGroup}
                  onChange={e => setDonationForm(f => ({ ...f, bloodGroup: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {bloodGroups.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Units</label>
                <input
                  type="number"
                  min={1}
                  value={donationForm.units}
                  onChange={e => setDonationForm(f => ({ ...f, units: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddUnits} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90">
                Add Units
              </button>
              <button onClick={() => setShowAddDonation(false)} className="flex-1 border border-border rounded-lg py-2 text-sm font-medium hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
