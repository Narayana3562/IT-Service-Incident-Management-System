export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.statusCode || (error.code === '23505' ? 409 : 500);
  const message = status === 500 ? 'Internal server error' : error.message;
  if (status === 500) console.error(error);
  res.status(status).json({ error: message });
}
