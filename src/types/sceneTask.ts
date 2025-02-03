import { User } from './user';
import { Scene } from './scene';

export interface SceneTask {
  id: string;
  description?: string;
  videoUrl?: string;
  sceneNumber?: number;
  status: SceneTaskStatus;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  createdByUserId: string;
  createdBy: User;
  assignedToUserId?: string;
  assignedTo?: User;
  sceneId?: string;
  scene?: Scene;
}

export enum SceneTaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED'
}
