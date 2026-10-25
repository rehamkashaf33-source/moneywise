const ApiError = require('../utils/ApiError');

/** validate(schema, 'body' | 'query') */
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const details = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, '') }));
    return next(new ApiError(422, details[0].message, details));
  }
  req[source] = value;
  next();
};
