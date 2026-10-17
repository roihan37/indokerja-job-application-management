export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const notFound = () =>
  new AppError(404, 'NOT_FOUND', 'Resource not found');
export const forbidden = () =>
  new AppError(403, 'FORBIDDEN', 'Access forbidden');
