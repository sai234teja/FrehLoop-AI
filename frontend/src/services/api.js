const API_BASE = '/api';

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/auth/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function demoLogin(userId) {
  const res = await fetch(`${API_BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error('Failed to login');
  return res.json();
}

export async function fetchDonations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.donor_id) params.append('donor_id', filters.donor_id);
  if (filters.ngo_id) params.append('ngo_id', filters.ngo_id);
  if (filters.volunteer_id) params.append('volunteer_id', filters.volunteer_id);

  const res = await fetch(`${API_BASE}/donations?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch donations');
  return res.json();
}

export async function createDonation(data) {
  const res = await fetch(`${API_BASE}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create donation');
  return res.json();
}

export async function uploadFoodPhoto(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/donations/upload-photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload photo');
  return res.json();
}

export async function inspectFoodImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/inspection/inspect`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Inspection failed');
  }
  return res.json();
}

export async function updateDonationStatus(id, status, assignedNgoId = null, assignedVolunteerId = null) {
  const res = await fetch(`${API_BASE}/donations/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      assigned_ngo_id: assignedNgoId,
      assigned_volunteer_id: assignedVolunteerId
    }),
  });
  if (!res.ok) {
    let errorMsg = 'Failed to update status';
    try {
      const errData = await res.json();
      if (errData && errData.detail) errorMsg = errData.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchMatchesForNgo(ngoId) {
  const res = await fetch(`${API_BASE}/matching/ngo/${ngoId}`);
  if (!res.ok) throw new Error('Failed to load matching scores');
  return res.json();
}

export async function fetchImpactStats() {
  const res = await fetch(`${API_BASE}/stats/impact`);
  if (!res.ok) throw new Error('Failed to load impact stats');
  return res.json();
}
