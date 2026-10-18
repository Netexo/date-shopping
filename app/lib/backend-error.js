export class BackendError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}
