export interface IResponseBase {
  statusCode: number;
  message: string;
  payload: any;
  error: boolean;
  timestamp?: string;
  path?: string;
}
