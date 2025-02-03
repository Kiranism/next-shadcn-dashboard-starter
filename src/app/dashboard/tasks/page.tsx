'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/hooks/useTasks';
import { Upload } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SceneTaskStatus } from '@/types/sceneTask';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';

const STATUS_TRANSLATIONS: Record<string, string> = {
  PENDING: '待领取',
  ASSIGNED: '已分配',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  REJECTED: '已拒绝'
};

// 获取任务列表
const getVideoTasks = () => {
  try {
    return JSON.parse(localStorage.getItem('taskQueueItems') || '[]');
  } catch {
    return [];
  }
};

export default function TasksPage() {
  const queryClient = useQueryClient();

  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: currentUserSession } = useSession();
  const currentUser = currentUserSession?.user;

  const {
    data: availableTasks,
    isLoading: isAvailableTasksLoading,
    error: availableTasksError
  } = useTasks({ status: SceneTaskStatus.PENDING }, 'available-tasks');

  const {
    data: currentUserTasks,
    isLoading: isCurrentUserTasksLoading,
    error: currentUserTasksError
  } = useTasks(
    { status: SceneTaskStatus.ASSIGNED, assignedToUserId: currentUser?.id },
    'user-tasks'
  );

  // 加载任务
  useEffect(() => {
    const loadTasks = () => {
      const tasks = getVideoTasks();
      //setTasks(tasks)
    };
    loadTasks();
    window.addEventListener('storage', loadTasks);
    return () => window.removeEventListener('storage', loadTasks);
  }, []);

  // 领取任务
  const handleClaimTask = async (task: any) => {
    try {
      const response = await fetch(`/api/tasks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          taskId: task.id,
          assignedToUserId: currentUser?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to claim task');
      }

      toast.success('Successfully claimed task');
      // Refetch tasks to update the UI
      await queryClient.invalidateQueries({ queryKey: ['available-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    } catch (error) {
      console.error('Error claiming task:', error);
      toast.error('Failed to claim task');
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      if (!currentUser?.isAdmin) {
        toast.error('You are not allowed to delete tasks');
        throw new Error('Current user is not allowed to delete tasks');
      }

      const response = await fetch(`/api/tasks?taskId=${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      toast.success('Successfully deleted task');
      // Refetch tasks to update the UI
      await queryClient.invalidateQueries({ queryKey: ['available-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['user-tasks'] });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  if (isAvailableTasksLoading) {
    return <div>Loading tasks...</div>;
  }

  if (availableTasksError) {
    return <div>Error loading tasks: {availableTasksError.message}</div>;
  }

  return (
    <div className='container mx-auto p-4'>
      <Tabs defaultValue='pending'>
        <div className='mb-4 flex items-center justify-between'>
          <TabsList>
            <TabsTrigger value='pending'>待领取任务</TabsTrigger>
            <TabsTrigger value='my'>我的任务</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='pending' className='space-y-4'>
          {!availableTasks || availableTasks.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>暂无待领取任务</div>
          ) : (
            availableTasks.map((task) => (
              <Card key={task.id} className='p-4'>
                <div className='flex gap-4'>
                  <div className='relative h-32 w-32 rounded bg-gray-100'>
                    {task.videoUrl && (
                      <video
                        src={task.videoUrl}
                        className='h-full w-full rounded object-cover'
                        onClick={() => {
                          setSelectedTask(task);
                          setShowVideoDialog(true);
                        }}
                      />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='mb-4 text-sm'>
                      <div>时长：{task.scene?.duration?.toFixed(2)}秒</div>
                      <div>
                        总时长：{task.scene?.startTime?.toFixed(2) || 0}秒 ~{' '}
                        {(
                          (task.scene?.startTime || 0) +
                          (task.scene?.duration || 0)
                        ).toFixed(2)}
                        秒
                      </div>
                      <div className='mt-2'>台词：{task.scene?.dialogue}</div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Badge>
                        {STATUS_TRANSLATIONS[task.status] || task.status}
                      </Badge>
                      <div className='space-x-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          删除任务
                        </Button>
                        <Button size='sm' onClick={() => handleClaimTask(task)}>
                          领取任务
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value='my' className='space-y-4'>
          {!currentUserTasks || currentUserTasks.length === 0 ? (
            <div className='py-8 text-center text-gray-500'>暂无我的任务</div>
          ) : (
            currentUserTasks.map((task) => (
              <Card key={task.id} className='p-4'>
                <div className='flex gap-4'>
                  <div className='relative h-32 w-32 rounded bg-gray-100'>
                    {task.videoUrl && (
                      <video
                        src={task.videoUrl}
                        className='h-full w-full rounded object-cover'
                        onClick={() => {
                          setSelectedTask(task);
                          setShowVideoDialog(true);
                        }}
                      />
                    )}
                  </div>
                  <div className='flex-1'>
                    <div className='mb-4 text-sm'>
                      <div>时长：{task.scene?.duration?.toFixed(2) || 0}秒</div>
                      <div>
                        总时长：{task.scene?.startTime?.toFixed(2) || 0}秒 ~{' '}
                        {(
                          (task.scene?.startTime || 0) +
                          (task.scene?.duration || 0)
                        ).toFixed(2)}
                        秒
                      </div>
                      <div className='mt-2'>
                        台词：{task.scene?.dialogue || ''}
                      </div>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Badge>
                        {STATUS_TRANSLATIONS[task.status] || task.status}
                      </Badge>
                      <Button
                        size='sm'
                        onClick={() => {
                          setSelectedTask(task);
                          setShowUploadDialog(true);
                        }}
                      >
                        上传视频
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 视频预览弹窗 */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className='max-w-4xl'>
          {selectedTask?.videoUrl && (
            <video
              src={selectedTask.videoUrl}
              controls
              className='max-h-[70vh] w-full rounded-lg object-contain'
              autoPlay
              playsInline
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 上传视频弹窗 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <div className='space-y-4'>
            <div className='text-lg font-medium'>上传视频</div>
            <div className='relative flex h-32 w-full items-center justify-center rounded border-2 border-dashed'>
              <input
                type='file'
                accept='video/*'
                className='absolute inset-0 cursor-pointer opacity-0'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && selectedTask) {
                    const videoUrl = URL.createObjectURL(file);

                    // 更新任务队列中的状态
                    // const updatedTasks = tasks.map(t => {
                    //   if (t.id === selectedTask.id) {
                    //     return {
                    //       ...t,
                    //       status: '已上传',
                    //       uploadedVideo: videoUrl
                    //     }
                    //   }
                    //   return t
                    // })
                    // localStorage.setItem('taskQueueItems', JSON.stringify(updatedTasks))
                    //setTasks(updatedTasks)

                    // 同步更新视频详情页的状态
                    const videoStates = JSON.parse(
                      localStorage.getItem('videoStates') || '{}'
                    );
                    const key = `${selectedTask.videoUrl}`;
                    if (videoStates[key]) {
                      videoStates[key] = {
                        ...videoStates[key],
                        status: '已上传',
                        uploadedVideo: videoUrl
                      };
                      localStorage.setItem(
                        'videoStates',
                        JSON.stringify(videoStates)
                      );
                    }

                    setShowUploadDialog(false);
                    toast.success('上传成功');
                  }
                }}
              />
              <div className='text-center'>
                <Upload className='mx-auto mb-2 h-8 w-8 text-gray-400' />
                <div className='text-sm text-gray-500'>点击或拖拽上传视频</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
