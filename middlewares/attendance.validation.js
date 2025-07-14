const Joi = require('joi');

// Validation for updating single attendance record
exports.updateAttendance = (req, res, next) => {
  const schema = Joi.object({
    date: Joi.string()
      .pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
      .required()
      .messages({
        'string.pattern.base': 'Date must be in YYYY-MM-DD format',
        'any.required': 'Date is required'
      }),
    shift: Joi.string().allow('', null).optional(),
    overtime_hours: Joi.number()
      .min(0)
      .max(24)
      .default(0)
      .messages({
        'number.min': 'Overtime hours cannot be negative',
        'number.max': 'Overtime hours cannot exceed 24'
      }),
    status: Joi.string()
      .valid('PRESENT', 'ABSENT', 'HALF_DAY')
      .messages({
        'any.only': 'Status must be PRESENT, ABSENT, or HALF_DAY',
        'any.required': 'Status is required'
      })
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};

// Validation for bulk updating attendance records
exports.bulkUpdateAttendance = (req, res, next) => {
  console.log('=== BULK UPDATE ATTENDANCE VALIDATION START ===');
  console.log('req.body:', JSON.stringify(req.body, null, 2));
  console.log('req.body type:', typeof req.body);
  console.log('req.body keys:', Object.keys(req.body || {}));
  
  // First, let's try a very simple validation
  if (!req.body) {
    console.log('ERROR: req.body is null or undefined');
    return res.status(400).json({ error: 'Request body is required' });
  }
  
  if (!req.body.date) {
    console.log('ERROR: date is missing');
    return res.status(400).json({ error: 'Date is required' });
  }
  
  if (!req.body.records || !Array.isArray(req.body.records)) {
    console.log('ERROR: records is missing or not an array');
    return res.status(400).json({ error: 'Records array is required' });
  }
  
  console.log('Basic validation passed, proceeding with Joi validation...');
  
  const recordSchema = Joi.object({
    employee_id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.guid': 'Employee ID must be a valid UUID',
        'any.required': 'Employee ID is required'
      }),
    status: Joi.string()
      .valid('PRESENT', 'ABSENT', 'HALF_DAY')
      .required()
      .messages({
        'any.only': 'Status must be PRESENT, ABSENT, or HALF_DAY',
        'any.required': 'Status is required'
      }),
    shift: Joi.string()
      .valid('SHIFT_1', 'SHIFT_2', 'SHIFT_3', 'N/A')
      .optional()
      .allow(null, '')
      .messages({
        'any.only': 'Shift must be SHIFT_1, SHIFT_2, SHIFT_3, or N/A'
      }),
    overtime_hours: Joi.number()
      .min(0)
      .max(24)
      .default(0)
      .messages({
        'number.min': 'Overtime hours cannot be negative',
        'number.max': 'Overtime hours cannot exceed 24'
      })
  });

  const schema = Joi.object({
    date: Joi.string()
      .pattern(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
      .required()
      .messages({
        'string.pattern.base': 'Date must be in YYYY-MM-DD format',
        'any.required': 'Date is required'
      }),
    records: Joi.array().items(recordSchema).min(1).required().messages({
      'array.min': 'At least one attendance record is required',
      'any.required': 'Records array is required'
    })
  });

  console.log('Schema created, validating...');
  
  const { error, value } = schema.validate(req.body, { 
    abortEarly: false
  });
  
  console.log('Validation result - error:', error);
  console.log('Validation result - value:', value);
  
  if (error) {
    console.log('Validation failed:', error.details);
    return res.status(400).json({
      error: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  
  console.log('Validation successful, setting req.body to validated value');
  req.body = value;
  console.log('=== BULK UPDATE ATTENDANCE VALIDATION END ===');
  next();
};

// Validation for query parameters
exports.validateQueryParams = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    empid: Joi.string()
      .uuid()
      .optional()
      .messages({
        'string.guid': 'Employee ID must be a valid UUID'
      }),
    date: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Date must be in YYYY-MM-DD format'
      }),
    start: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
      }),
    startDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Start date must be in YYYY-MM-DD format'
      }),
    end: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'End date must be in YYYY-MM-DD format'
      }),
    endDate: Joi.string()
      .pattern(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .messages({
        'string.pattern.base': 'End date must be in YYYY-MM-DD format'
      }),
    shift: Joi.string()
      .valid('SHIFT_1', 'SHIFT_2', 'SHIFT_3')
      .optional()
      .allow(null, '')
      .messages({
        'any.only': 'Shift must be SHIFT_1, SHIFT_2, or SHIFT_3'
      }),
    status: Joi.string()
      .valid('PRESENT', 'ABSENT', 'HALF_DAY')
      .optional()
      .messages({
        'any.only': 'Status must be PRESENT, ABSENT, or HALF_DAY'
      }),
    department: Joi.string()
      .optional()
      .max(100)
      .messages({
        'string.max': 'Department name cannot exceed 100 characters'
      }),
    month: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .optional()
      .messages({
        'number.base': 'Month must be a number',
        'number.integer': 'Month must be an integer',
        'number.min': 'Month must be at least 1',
        'number.max': 'Month cannot exceed 12'
      }),
    year: Joi.number()
      .integer()
      .min(2000)
      .max(2100)
      .optional()
      .messages({
        'number.base': 'Year must be a number',
        'number.integer': 'Year must be an integer',
        'number.min': 'Year must be at least 2000',
        'number.max': 'Year cannot exceed 2100'
      })
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  next();
};
