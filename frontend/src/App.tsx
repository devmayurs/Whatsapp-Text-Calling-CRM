import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Forms
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [treatment, setTreatment] = useState('');

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URL}/clients`);
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${API_URL}/appointments`);
      setAppointments(res.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchAppointments();
    
    const interval = setInterval(() => {
      fetchClients();
      fetchAppointments();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const addClient = async () => {
    if (!phone || !name) {
      alert('Please fill in phone and name');
      return;
    }
    try {
      await axios.post(`${API_URL}/clients`, {
        phone_number: phone,
        client_name: name,
        email,
        preferred_treatment: treatment,
        status: 'Active'
      });
      setPhone(''); setName(''); setEmail(''); setTreatment('');
      alert('✓ Client added successfully!');
      fetchClients();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteClient = async (id: number) => {
    if (window.confirm('Delete this client?')) {
      try {
        await axios.delete(`${API_URL}/clients/${id}`);
        fetchClients();
      } catch (err) {
        console.error('Error deleting client:', err);
      }
    }
  };

  const addSampleAppointment = async () => {
    try {
      await axios.post(`${API_URL}/appointments`, {
        phone_number: '+1 (555) ' + Math.floor(1000 + Math.random() * 9000),
        client_name: 'Sample User',
        treatment: 'Botox',
        appointment_date: new Date().toLocaleString(),
        status: 'Booked',
        gemini_notes: 'Sample booking generated for testing'
      });
      alert('✓ Sample appointment added!');
      fetchAppointments();
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>💆 Simple Med Spa CRM</h1>
        <p>WhatsApp + Google Gemini AI + n8n (Self-Hosted) • Zero Third-Party Costs</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📋 Overview</button>
        <button className={`tab ${activeTab === 'n8n-setup' ? 'active' : ''}`} onClick={() => setActiveTab('n8n-setup')}>⚙️ n8n Setup</button>
        <button className={`tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>👥 Clients CRM</button>
        <button className={`tab ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>📅 Appointments</button>
      </div>

      {activeTab === 'overview' && (
        <div className="content active">
          <div className="card">
            <h2>How This Simple CRM Works</h2>
            <p>Patient sends a WhatsApp message or calls → n8n receives it → Google Gemini AI responds with med spa context → Customer confirms booking → Data saved to PostgreSQL database → You see it in the CRM table.</p>
          </div>
          <div className="message message-info">
            <span className="icon">ℹ️</span>
            <div><strong>Zero Cost Setup:</strong> n8n self-hosted, Google Gemini API (free tier), WhatsApp Business API, PostgreSQL local DB.</div>
          </div>
          <div className="grid">
            <div className="card">
              <h3>✓ What's Included</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                <li>WhatsApp inbound messages & calls</li>
                <li>Gemini AI responses (med spa context only)</li>
                <li>Simple appointment booking flow</li>
                <li>Client database (PostgreSQL)</li>
                <li>Appointment history table</li>
              </ul>
            </div>
            <div className="card">
              <h3>✗ What's NOT Included</h3>
              <ul style={{ marginLeft: '1.5rem' }}>
                <li>Automated reminders</li>
                <li>Payment processing</li>
                <li>Complex analytics</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'n8n-setup' && (
        <div className="content active">
          <div className="card">
            <h2>n8n PostgreSQL Workflow Status</h2>
            <p>This application is now wired up with PostgreSQL and React.</p>
            <p>Make sure to start the backend with <code>npm run dev</code> inside <code>backend/api</code> and run n8n using <code>npx n8n</code>.</p>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="content active">
          <div className="card">
            <h2>Add New Client</h2>
            <form style={{ display: 'grid', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Phone Number (WhatsApp)</label>
                <input type="tel" className="input" placeholder="+1 (555) 234-7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Client Name</label>
                <input type="text" className="input" placeholder="e.g., Sarah Johnson" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Email (Optional)</label>
                <input type="email" className="input" placeholder="sarah@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Preferred Treatment</label>
                <select className="select" value={treatment} onChange={(e) => setTreatment(e.target.value)}>
                  <option value="">Select a treatment</option>
                  <option value="Botox">Botox</option>
                  <option value="Dermal Filler">Dermal Filler</option>
                  <option value="HydraFacial">HydraFacial</option>
                  <option value="Chemical Peel">Chemical Peel</option>
                  <option value="Laser Resurfacing">Laser Resurfacing</option>
                  <option value="Microneedling">Microneedling</option>
                  <option value="Microneedling + PRP">Microneedling + PRP</option>
                </select>
              </div>
              <button type="button" className="btn btn-primary" onClick={addClient}>Add Client</button>
            </form>
          </div>

          <div className="card">
            <h2>Clients Database</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Phone Number</th>
                    <th>Client Name</th>
                    <th>Email</th>
                    <th>Preferred Treatment</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        No clients yet. Add one using the form above.
                      </td>
                    </tr>
                  ) : clients.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.phone_number}</strong></td>
                      <td>{c.client_name}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.preferred_treatment || '—'}</td>
                      <td><span className="badge badge-new">{c.status}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(c.created_at).toLocaleString()}</td>
                      <td><button className="btn btn-outline" onClick={() => deleteClient(c.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="content active">
          <div className="card">
            <h2>Appointments Table</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client Phone</th>
                    <th>Client Name</th>
                    <th>Treatment</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                        No appointments yet. Bookings will appear here automatically from WhatsApp.
                      </td>
                    </tr>
                  ) : appointments.map(a => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.phone_number}</td>
                      <td>{a.client_name}</td>
                      <td>{a.treatment}</td>
                      <td>{a.appointment_date}</td>
                      <td><span className="badge badge-confirmed">{a.status}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2>Sample Appointments (For Testing)</h2>
            <button className="btn btn-outline" onClick={addSampleAppointment}>Add Sample Appointment</button>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>This helps you test the CRM before connecting real WhatsApp data.</p>
          </div>
        </div>
      )}
    </div>
  );
}