const deadline = `2025-03-04T04:59:00.000Z`;

export function hasDeadlinePassed() {
  return new Date() > new Date(deadline);
}