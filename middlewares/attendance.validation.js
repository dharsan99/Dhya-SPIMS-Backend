const Joi = require('joi');

const attendanceSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  shift: Joi.string().required(),
  in_time: Joi.date().iso().required(),
  out_time: Joi.date().iso().greater(Joi.ref('in_time')).required(),
  overtime_hours: Joi.number().min(0).required(),
  status: Joi.string().valid('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE').required()
});

const validateAttendance = (req, res, next) => {
  const { error } = attendanceSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details.map((d) => d.message)
    });
  }
  next();
};

module.exports = validateAttendance;
