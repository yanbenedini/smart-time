const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- EMPLOYEES ---

// Get All Employees
app.get('/employees', async (req, res) => {
  try {
    const allEmployees = await pool.query('SELECT * FROM employees ORDER BY first_name ASC');
    // Map snake_case database fields to camelCase frontend expectations
    const formatted = allEmployees.rows.map(e => ({
      id: e.id,
      matricula: e.matricula,
      firstName: e.first_name,
      lastName: e.last_name,
      email: e.email,
      role: e.role,
      squad: e.squad,
      shiftStart: e.shift_start,
      shiftEnd: e.shift_end
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Create Employee
app.post('/employees', async (req, res) => {
  try {
    const { matricula, firstName, lastName, email, role, squad, shiftStart, shiftEnd } = req.body;
    const newEmployee = await pool.query(
      'INSERT INTO employees (matricula, first_name, last_name, email, role, squad, shift_start, shift_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [matricula, firstName, lastName, email, role, squad, shiftStart, shiftEnd]
    );
    res.json(newEmployee.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update Employee
app.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { matricula, firstName, lastName, email, role, squad, shiftStart, shiftEnd } = req.body;
    await pool.query(
      'UPDATE employees SET matricula = $1, first_name = $2, last_name = $3, email = $4, role = $5, squad = $6, shift_start = $7, shift_end = $8 WHERE id = $9',
      [matricula, firstName, lastName, email, role, squad, shiftStart, shiftEnd, id]
    );
    res.json("Employee was updated!");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete Employee
app.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    res.json("Employee was deleted!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- ABSENCES ---

app.get('/absences', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM absences ORDER BY date DESC');
    const formatted = result.rows.map(a => ({
      id: a.id,
      employeeId: a.employee_id,
      reason: a.reason,
      date: a.date.toISOString().split('T')[0],
      endDate: a.end_date.toISOString().split('T')[0],
      startTime: a.start_time,
      endTime: a.end_time,
      durationMinutes: a.duration_minutes,
      observation: a.observation,
      approved: a.approved,
      createdBy: a.created_by,
      createdAt: a.created_at,
      updatedBy: a.updated_by,
      updatedAt: a.updated_at
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.post('/absences', async (req, res) => {
  try {
    const { employeeId, reason, date, endDate, startTime, endTime, durationMinutes, observation, createdBy, createdAt } = req.body;
    const result = await pool.query(
      'INSERT INTO absences (employee_id, reason, date, end_date, start_time, end_time, duration_minutes, observation, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [employeeId, reason, date, endDate, startTime, endTime, durationMinutes, observation, createdBy, createdAt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/absences/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM absences WHERE id = $1', [id]);
    res.json("Absence deleted");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- SHIFT CHANGES ---

app.get('/shift-changes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shift_changes ORDER BY start_date DESC');
    const formatted = result.rows.map(s => ({
      id: s.id,
      employeeId: s.employee_id,
      originalShiftStart: s.original_shift_start,
      originalShiftEnd: s.original_shift_end,
      newShiftStart: s.new_shift_start,
      newShiftEnd: s.new_shift_end,
      startDate: s.start_date.toISOString().split('T')[0],
      endDate: s.end_date.toISOString().split('T')[0],
      reason: s.reason,
      createdBy: s.created_by,
      createdAt: s.created_at,
      updatedBy: s.updated_by,
      updatedAt: s.updated_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post('/shift-changes', async (req, res) => {
  try {
    const { employeeId, originalShiftStart, originalShiftEnd, newShiftStart, newShiftEnd, startDate, endDate, reason, createdBy, createdAt } = req.body;
    const result = await pool.query(
      'INSERT INTO shift_changes (employee_id, original_shift_start, original_shift_end, new_shift_start, new_shift_end, start_date, end_date, reason, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [employeeId, originalShiftStart, originalShiftEnd, newShiftStart, newShiftEnd, startDate, endDate, reason, createdBy, createdAt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/shift-changes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM shift_changes WHERE id = $1', [id]);
    res.json("Shift change deleted");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- ON CALL ---

app.get('/on-call', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM on_call_shifts ORDER BY date DESC');
    const formatted = result.rows.map(o => ({
      id: o.id,
      employeeId: o.employee_id,
      date: o.date.toISOString().split('T')[0],
      startTime: o.start_time,
      endTime: o.end_time,
      observation: o.observation,
      createdBy: o.created_by,
      createdAt: o.created_at,
      updatedBy: o.updated_by,
      updatedAt: o.updated_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post('/on-call', async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, observation, createdBy, createdAt } = req.body;
    const result = await pool.query(
      'INSERT INTO on_call_shifts (employee_id, date, start_time, end_time, observation, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [employeeId, date, startTime, endTime, observation, createdBy, createdAt]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/on-call/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM on_call_shifts WHERE id = $1', [id]);
    res.json("On Call Shift deleted");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// --- USERS ---

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_users');
    const formatted = result.rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      isAdmin: u.is_admin
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    const result = await pool.query(
      'INSERT INTO system_users (name, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, password, isAdmin]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM system_users WHERE id = $1', [id]);
    res.json("User deleted");
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});