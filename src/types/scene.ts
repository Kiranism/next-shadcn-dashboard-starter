export interface Scene {
  id: string;
  name: string;
  dialogue?: string;
  duration: number;
  size: number;
  resolution?: string;
  startTime: number;
  endTime: number;
  createdAt: Date;
  updatedAt: Date;
}
