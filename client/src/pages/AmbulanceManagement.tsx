import React, { useState } from 'react';
import { Truck, MapPin, Phone, AlertTriangle, X, CheckCircle, Clock, ShieldAlert, ArrowRight, User } from 'lucide-react';

interface Ambulance {
  id: string;
  vehicleNo: string;
  type: string;
  driverName: string;
  driverPhone: string;
  status: 'AVAILABLE' | 'ON_ROUTE' | 'MAINTENANCE';
  lastLocation: string;
}

interface DispatchLog {
  id: string;
  ambulanceId: string;
  patientLocation: string;
  callerName?: string;
  callerPhone?: string;
  dispatchedAt: string;
  priority: 'Critical' | 'Urgent' | 'Standard';
  status: 'In Progress' | 'Completed';
  notes?: string;
}

const initialAmbulances: Ambulance[] = [
  { id: '1', vehicleNo: 'DL 1A 1234', type: 'Advanced Life Support (ALS)', driverName: 'Ramu Singh', driverPhone: '9988776655', status: 'AVAILABLE', lastLocation: 'Hospital Base' },
  { id: '2', vehicleNo: 'DL 1A 5678', type: 'Basic Life Support (BLS)', driverName: 'Kishan Kumar', driverPhone: '9988776656', status: 'ON_ROUTE', lastLocation: 'Sector 15, Near Park' },
  { id: '3', vehicleNo: 'DL 1A 9012', type: 'Patient Transport', driverName: 'Rajesh Sharma', driverPhone: '9988776657', status: 'MAINTENANCE', lastLocation: 'Garage Workshop' },
  { id: '4', vehicleNo: 'DL 1A 3456', type: 'Cardiac Care Unit', driverName: 'Sanjay Verma', driverPhone: '9988776658', status: 'AVAILABLE', lastLocation: 'Hospital Base' },
];

const initialDispatchLogs: DispatchLog[] = [
  { id: '1', ambulanceId: '2', patientLocation: 'Sector 15, Near Park', callerName: 'Vikram Joshi', callerPhone: '9811223344', dispatchedAt: '15 Oct 2026, 10:30 AM', priority: 'Critical', status: 'In Progress', notes: 'Severe respiratory distress reported' },
  { id: '2', ambulanceId: '1', patientLocation: 'MG Road, Phase 2', callerName: 'Sunita Reddy', callerPhone: '9822334455', dispatchedAt: '14 Oct 2026, 08:15 PM', priority: 'Urgent', status: 'Completed', notes: 'Accident trauma patient transported to ER' },
];

export const AmbulanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'dispatch'>('fleet');
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(initialDispatchLogs);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  // Form state
  const [ambulanceId, setAmbulanceId] = useState('');
  const [patientLocation, setPatientLocation] = useState('');
  const [callerName, setCallerName] = useState('');
  const [callerPhone, setCallerPhone] = useState('');
  const [priority, setPriority] = useState<'Critical' | 'Urgent' | 'Standard'>('Critical');
  const [notes, setNotes] = useState('');

  const availableAmbulances = ambulances.filter(a => a.status === 'AVAILABLE');

  const handleOpenDispatch = (preselectedId?: string) => {
    setAmbulanceId(preselectedId || (availableAmbulances[0]?.id ?? ''));
    setPatientLocation('');
    setCallerName('');
    setCallerPhone('');
    setPriority('Critical');
    setNotes('');
    setShowDispatchModal(true);
  };

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ambulanceId || !patientLocation) return;

    const amb = ambulances.find(a => a.id === ambulanceId);
    if (!amb) return;

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newLog: DispatchLog = {
      id: Date.now().toString(),
      ambulanceId: amb.id,
      patientLocation,
      callerName: callerName || 'Emergency Call',
      callerPhone: callerPhone || '—',
      dispatchedAt: formattedDate,
      priority,
      status: 'In Progress',
      notes: notes || 'Dispatched by hospital emergency desk',
    };

    // Update state
    setAmbulances(prev => prev.map(a => a.id === amb.id ? { ...a, status: 'ON_ROUTE', lastLocation: patientLocation } : a));
    setDispatchLogs(prev => [newLog, ...prev]);
    setShowDispatchModal(false);
    setActiveTab('dispatch');
  };

  const handleCompleteDispatch = (logId: string) => {
    const log = dispatchLogs.find(l => l.id === logId);
    if (!log) return;

    setDispatchLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'Completed' } : l));
    setAmbulances(prev => prev.map(a => a.id === log.ambulanceId ? { ...a, status: 'AVAILABLE', lastLocation: 'Hospital Base' } : a));
  };

  const totalCount = ambulances.length;
  const availableCount = availableAmbulances.length;
  const onRouteCount = ambulances.filter(a => a.status === 'ON_ROUTE').length;
  const maintenanceCount = ambulances.filter(a => a.status === 'MAINTENANCE').length;

  const tabs = [
    { id: 'fleet', label: `Fleet Management (${totalCount})`, icon: Truck },
    { id: 'dispatch', label: `Dispatch Logs (${dispatchLogs.length})`, icon: MapPin },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ambulance Management</h1>
          <p className="text-muted-foreground mt-1">Real-time emergency dispatch and fleet tracking.</p>
        </div>
        <button
          onClick={() => handleOpenDispatch()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <AlertTriangle className="h-4 w-4" />
          Emergency Dispatch
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">Total Fleet</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{totalCount}</p>
          <span className="text-xs text-muted-foreground">Vehicles in hospital base</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">Available Now</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{availableCount}</p>
          <span className="text-xs text-emerald-600/80 font-medium">Ready for immediate dispatch</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">On Route</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{onRouteCount}</p>
          <span className="text-xs text-blue-600/80 font-medium">Active emergency trips</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground uppercase">Maintenance</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{maintenanceCount}</p>
          <span className="text-xs text-muted-foreground">Under service/check</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === id ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Fleet View */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ambulances.map(amb => (
            <div key={amb.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                    amb.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' :
                    amb.status === 'ON_ROUTE' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                  }`}>
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">{amb.vehicleNo}</h3>
                    <p className="text-xs text-muted-foreground">{amb.type}</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  amb.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  amb.status === 'ON_ROUTE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {amb.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2.5 text-sm border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Driver:</span> {amb.driverName}
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span> {amb.driverPhone}
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span> {amb.lastLocation}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-border">
                {amb.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => handleOpenDispatch(amb.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Dispatch This Vehicle
                  </button>
                ) : amb.status === 'ON_ROUTE' ? (
                  <div className="text-center py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center justify-center gap-2">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    Currently On Route (Active)
                  </div>
                ) : (
                  <div className="text-center py-1.5 px-3 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                    In Maintenance
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Logs View */}
      {activeTab === 'dispatch' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ambulance</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dispatched At</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Emergency Location</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Caller Contact</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {dispatchLogs.map(log => {
                const amb = ambulances.find(a => a.id === log.ambulanceId);
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{amb?.vehicleNo || 'Ambulance'}</p>
                      <p className="text-xs text-muted-foreground">{amb?.driverName} ({amb?.driverPhone})</p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs whitespace-nowrap">
                      {log.dispatchedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {log.patientLocation}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-foreground text-xs font-medium">{log.callerName || 'Emergency'}</p>
                      <p className="text-xs text-muted-foreground">{log.callerPhone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        log.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                        log.priority === 'Urgent' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {log.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}>
                        {log.status === 'Completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3 animate-spin" />
                        )}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {log.status === 'In Progress' ? (
                        <button
                          onClick={() => handleCompleteDispatch(log.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                          title="Patient received and ambulance returned to base"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Complete
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Archived</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Emergency Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-card border border-border shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
                <h2 className="text-lg font-bold text-foreground">Emergency Ambulance Dispatch</h2>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Assign Ambulance *
                </label>
                {availableAmbulances.length > 0 ? (
                  <select
                    value={ambulanceId}
                    onChange={e => setAmbulanceId(e.target.value)}
                    required
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {availableAmbulances.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.vehicleNo} — {a.driverName} ({a.type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300">
                    ⚠️ No ambulances are currently marked as AVAILABLE. Please wait for an active vehicle to return.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Emergency Pickup Location / Destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 21, Market Road, Near City Mall"
                  value={patientLocation}
                  onChange={e => setPatientLocation(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Caller Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={callerName}
                    onChange={e => setCallerName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Caller Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={callerPhone}
                    onChange={e => setCallerPhone(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Critical', 'Urgent', 'Standard'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        priority === p
                          ? p === 'Critical'
                            ? 'bg-red-600 text-white border-red-600'
                            : p === 'Urgent'
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Emergency Notes / Symptoms
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Severe chest pain, unconsciousness, vehicle accident..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableAmbulances.length === 0 || !patientLocation}
                  className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Confirm Dispatch
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
