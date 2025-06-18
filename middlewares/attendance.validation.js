const Joi = require('joi');

const attendanceSchema = Joi.object({
  employee_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  status: Joi.string().valid('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE').required(),

  shift: Joi.alternatives().conditional('status', {
    is: Joi.valid('PRESENT', 'HALF_DAY'),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),

  in_time: Joi.alternatives().conditional('status', {
    is: Joi.valid('PRESENT', 'HALF_DAY'),
    then: Joi.date().iso().required(),
    otherwise: Joi.forbidden(),
  }),

  out_time: Joi.alternatives().conditional('status', {
    is: Joi.valid('PRESENT', 'HALF_DAY'),
    then: Joi.date().iso().greater(Joi.ref('in_time')).required(),
    otherwise: Joi.forbidden(),
  }),

  overtime_hours: Joi.alternatives().conditional('status', {
    is: Joi.valid('PRESENT', 'HALF_DAY'),
    then: Joi.number().min(0).optional(),
    otherwise: Joi.forbidden(),
  }),
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
