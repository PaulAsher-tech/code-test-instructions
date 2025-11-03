export interface ShortenRequest {
  fullUrl: string;
  customAlias?: string;
}

export interface ShortenResponse {
  shortUrl: string;
}

export interface UrlItem {
  alias: string;
  fullUrl: string;
  shortUrl: string;
}

export class ApiError extends Error {
  public readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}


