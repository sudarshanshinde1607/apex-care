import React, { useState } from 'react';
import { Truck, MapPin, Phone, Plus, AlertTriangle } from 'lucide-react';

const mockAmbulances = [
  { id: '1', vehicleNo: 'DL 1A 1234', driverName: 'Ramu Singh', driverPhone: '9988776655', status: 'AVAILABLE', lastLocation: 'Hospital Base' },
  { id: '2', vehicleNo: 'DL 1A 5678', driverName: 'Kishan Kumar', driverPhone: '9988776656', status: 'ON_ROUTE', lastLocation: 'Sector 15' },
  { id: '3', vehicleNo: 'DL 1A 9012', driverName: 'Rajesh Sharma', driverPhone: '9988776657', status: 'MAINTENANCE', lastLocation: 'Garage' },
];

const mockDispatchLogs = [
  { id: '1', ambulanceId: '2', patientLocation: 'Sector 15, Near Park', dispatchedAt: '2026-10-09 10:30 AM', status: 'In Progress' },
  { id: '2', ambulanceId: '1', patientLocation: 'MG Road, Phase 2', dispatchedAt: '2026-10-08 08:15 PM', status: 'Completed' },
];

export const AmbulanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'dispatch'>('fleet');
  
  const tabs = [
    { id: 'fleet', label: 'Fleet Management', icon: Truck },
    { id: 'dispatch', label: 'Dispatch Logs', icon: MapPin },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ambulance Management</h1>
          <p className="text-muted-foreground mt-1">Track ambulance fleet and emergency dispatches.</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          <AlertTriangle className="h-4 w-4" />
          Emergency Dispatch
        </button>
      </div>

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

      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockAmbulances.map(amb => (
            <div key={amb.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{amb.vehicleNo}</h3>
                    <p className="text-xs text-muted-foreground">Basic Life Support</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  amb.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                  amb.status === 'ON_ROUTE' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {amb.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="space-y-2 mt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>Driver: {amb.driverName}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{amb.driverPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Loc: {amb.lastLocation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ambulance</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dispatched At</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Destination</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockDispatchLogs.map(log => {
                const amb = mockAmbulances.find(a => a.id === log.ambulanceId);
                return (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{amb?.vehicleNo} ({amb?.driverName})</td>
                    <td className="py-3 px-4 text-muted-foreground">{log.dispatchedAt}</td>
                    <td className="py-3 px-4 text-muted-foreground">{log.patientLocation}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Helper for UserIcon since it's not imported above to save space
function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
