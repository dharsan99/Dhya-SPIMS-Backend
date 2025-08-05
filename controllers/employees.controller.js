const employeeService = require('../services/employees.service');

exports.createEmployee = async (req, res) => {
  try {
    const { name, aadharNo, bankAcc1, shiftRate } = req.body;

    if (!name || !aadharNo || !bankAcc1 || shiftRate == null) {
      return res.status(400).json({ error: 'Missing required fields (name, aadharNo, bankAcc1, shiftRate)' });
    }

    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (err) {
    console.error('❌ Error creating employee:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getAllEmployees();
    res.json(employees);
  } catch (err) {
    console.error('❌ Error fetching employees:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('❌ Error fetching employee:', err);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await employeeService.updateEmployee(req.params.id, req.body);
    res.json(updatedEmployee);
  } catch (err) {
    console.error('❌ Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('❌ Error deleting employee:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await employeeService.getAllDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};