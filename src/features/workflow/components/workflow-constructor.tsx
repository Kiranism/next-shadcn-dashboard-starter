/**
 * @file: src/features/workflow/components/workflow-constructor.tsx
 * @description: Основной компонент конструктора workflow в стиле n8n
 * @project: SaaS Bonus System
 * @dependencies: React, React Flow, Workflow types
 * @created: 2025-01-11
 * @author: AI Assistant + User
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  Viewport,
  NodeMouseHandler,
  EdgeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { Trash2, Copy, Edit, AlignVerticalJustifyCenter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Components
import { WorkflowToolbar } from './workflow-toolbar';
import { WorkflowProperties } from './workflow-properties';
import { WorkflowHeader } from './workflow-header';
import { WorkflowValidationPanel } from './workflow-validation-panel';

// Node types
import { workflowNodeTypes } from './nodes/workflow-node-types';

// Hooks
import { useWorkflow } from '../hooks/use-workflow';

// Types
import type {
  WorkflowNode,
  WorkflowConnection,
  Workflow,
  WorkflowNodeType,
  WorkflowConnectionType,
  WorkflowNodeData,
  WorkflowNodeConfig,
  Position
} from '@/types/workflow';
import {
  validateWorkflow,
  type WorkflowValidationResult
} from '@/lib/services/workflow/workflow-validator';

interface WorkflowConstructorProps {
  projectId: string;
}

export function WorkflowConstructor({ projectId }: WorkflowConstructorProps) {
  const { toast } = useToast();

  // State
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId?: string;
    edgeId?: string;
    x: number;
    y: number;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [validationResult, setValidationResult] =
    useState<WorkflowValidationResult | null>(null);

  // Custom hooks
  const {
    workflows,
    currentWorkflow,
    isLoading,
    loadWorkflows,
    createWorkflow,
    updateWorkflow,
    loadWorkflow,
    saveWorkflow,
    deleteWorkflow,
    exportWorkflow,
    importWorkflow,
    setCurrentWorkflow
  } = useWorkflow(projectId);

  // Auto layout функция
  const onAutoLayout = useCallback(() => {
    if (!reactFlowInstance) return;

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 256, height: 142 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 128,
          y: nodeWithPosition.y - 71
        }
      };
    });

    setNodes(layoutedNodes);

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 0);
  }, [nodes, edges, setNodes, reactFlowInstance]);

  // Convert WorkflowConnection[] to Edge[]
  const workflowConnectionsToEdges = useCallback(
    (connections: WorkflowConnection[]): Edge[] => {
      return connections.map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: connection.type || 'default',
        animated: connection.animated,
        style: connection.style
      }));
    },
    []
  );

  const edgesToWorkflowConnections = useCallback(
    (edgeList: Edge[]): WorkflowConnection[] =>
      edgeList.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: (edge.type as WorkflowConnectionType) || 'default',
        animated: edge.animated,
        style: (edge.style as Record<string, any>) || undefined
      })),
    []
  );

  // Sync currentWorkflow with React Flow state
  useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes);
      setEdges(workflowConnectionsToEdges(currentWorkflow.connections));
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [currentWorkflow, setNodes, setEdges, workflowConnectionsToEdges]);

  useEffect(() => {
    if (nodes.length === 0) {
      setValidationResult(null);
      return;
    }

    const connections = edgesToWorkflowConnections(edges);
    setValidationResult(validateWorkflow(nodes, connections));
  }, [nodes, edges, edgesToWorkflowConnections]);

  // Handle adding new nodes
  const handleAddNode = useCallback(
    (nodeType: WorkflowNodeType, position: Position) => {
      // Блокируем добавление нод, если нет выбранного workflow
      if (!currentWorkflow) {
        return;
      }

      const newNode: WorkflowNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: getDefaultLabel(nodeType),
          config: getDefaultConfig(nodeType)
        }
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, currentWorkflow]
  );

  // Handle drag and drop from toolbar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Блокируем drop, если нет выбранного workflow
      if (!currentWorkflow) {
        return;
      }

      const nodeType = event.dataTransfer.getData(
        'application/reactflow'
      ) as WorkflowNodeType;

      if (!nodeType || !reactFlowInstance) {
        return;
      }

      // Получаем позицию курсора относительно канваса
      const reactFlowBounds = (event.target as HTMLElement)
        .closest('.react-flow')
        ?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      handleAddNode(nodeType, position);
    },
    [reactFlowInstance, handleAddNode, currentWorkflow]
  );

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      if (!reactFlowInstance) return;
      const node = reactFlowInstance.getNode(nodeId);
      if (!node) return;

      reactFlowInstance.fitView({
        nodes: [{ id: nodeId }],
        padding: 0.3,
        duration: 400
      });

      const found = nodes.find((n) => n.id === nodeId) ?? null;
      setSelectedNode(found);
    },
    [reactFlowInstance, nodes]
  );

  // Helper to get default label for a new node
  const getDefaultLabel = (nodeType: WorkflowNodeType): string => {
    switch (nodeType) {
      // Триггеры
      case 'trigger.command':
        return 'Команда';
      case 'trigger.message':
        return 'Сообщение';
      case 'trigger.callback':
        return 'Callback';
      case 'trigger.webhook':
        return 'Webhook';
      case 'trigger.schedule':
        return 'Расписание';

      // Сообщения
      case 'message':
        return 'Сообщение';

      // Действия
      case 'action.api_request':
        return 'API запрос';
      case 'action.database_query':
        return 'База данных';
      case 'action.set_variable':
        return 'Установить переменную';
      case 'action.get_variable':
        return 'Получить переменную';
      case 'action.send_notification':
        return 'Отправить уведомление';
      case 'action.check_user_linked':
        return 'Проверить связь';
      case 'action.find_user_by_contact':
        return 'Найти по контакту';
      case 'action.link_telegram_account':
        return 'Связать аккаунт';
      case 'action.get_user_balance':
        return 'Получить баланс';
      case 'action.check_channel_subscription':
        return 'Проверка подписки';
      case 'action.partner_org_summary':
        return 'Сводка организации';
      case 'action.partner_team':
        return 'Команда партнёра';
      case 'action.partner_link':
        return 'Реф. ссылка партнёра';
      case 'action.partner_payouts':
        return 'Выплаты партнёра';
      case 'action.partner_subject_stats':
        return 'Стата подопечного';

      // Условия
      case 'condition':
        return 'Условие';

      // Поток управления
      case 'flow.delay':
        return 'Задержка';
      case 'flow.loop':
        return 'Цикл';
      case 'flow.sub_workflow':
        return 'Подпроцесс';
      case 'flow.jump':
        return 'Переход';
      case 'flow.end':
        return 'Завершение';

      // Интеграции
      case 'integration.webhook':
        return 'Webhook';
      case 'integration.analytics':
        return 'Аналитика';

      default:
        return 'Новая нода';
    }
  };

  // Helper to get default config for a new node
  const getDefaultConfig = (nodeType: WorkflowNodeType): WorkflowNodeConfig => {
    switch (nodeType) {
      // Триггеры
      case 'trigger.command':
        return { 'trigger.command': { command: '/start' } };
      case 'trigger.message':
        return { 'trigger.message': { pattern: '.*' } };
      case 'trigger.callback':
        return { 'trigger.callback': { callbackData: 'btn_click' } };
      case 'trigger.webhook':
        return {
          'trigger.webhook': {
            webhookUrl: 'https://example.com/webhook',
            method: 'POST'
          }
        };
      case 'trigger.schedule':
        return {
          'trigger.schedule': {
            cron: '0 9 * * *',
            timezone: 'Europe/Moscow',
            audience: { type: 'birthday_today' },
            dedupeWindow: 'year'
          }
        };

      // Сообщения
      case 'message':
        return { message: { text: 'Привет! Это сообщение.' } };

      // Действия
      case 'action.api_request':
        return {
          'action.api_request': {
            url: 'https://api.example.com',
            method: 'GET'
          }
        };
      case 'action.database_query':
        return {
          'action.database_query': {
            query: 'SELECT * FROM users WHERE id = $1',
            assignTo: 'result'
          }
        };
      case 'action.set_variable':
        return {
          'action.set_variable': {
            variableName: 'myVar',
            variableValue: 'value',
            scope: 'user'
          }
        };
      case 'action.get_variable':
        return {
          'action.get_variable': { variableName: 'myVar', assignTo: 'result' }
        };
      case 'action.send_notification':
        return {
          'action.send_notification': {
            notificationType: 'telegram',
            recipient: '{{telegram.userId}}'
          }
        };
      case 'action.check_user_linked':
        return {
          'action.check_user_linked': {
            userIdentifier: '{{telegram.userId}}',
            assignTo: 'isLinked'
          }
        };
      case 'action.find_user_by_contact':
        return {
          'action.find_user_by_contact': {
            contactType: 'phone',
            contactValue: '{{telegram.userPhone}}',
            assignTo: 'user'
          }
        };
      case 'action.link_telegram_account':
        return {
          'action.link_telegram_account': {
            telegramId: '{{telegram.userId}}',
            contactType: 'phone',
            contactValue: '{{telegram.userPhone}}'
          }
        };
      case 'action.get_user_balance':
        return { 'action.get_user_balance': { assignTo: 'balance' } };
      case 'action.check_channel_subscription':
        return {
          'action.check_channel_subscription': {
            channelId: '@channelname',
            assignTo: 'isChannelSubscribed'
          }
        };
      case 'action.partner_org_summary':
        return { 'action.partner_org_summary': { topLimit: 5 } };
      case 'action.partner_team':
        return {
          'action.partner_team': {
            pageSize: 5,
            page: '{{telegram.callback.params[0]}}'
          }
        };
      case 'action.partner_link':
        return {
          'action.partner_link': {
            additionalParams: { utm_source: 'partner-bot' }
          }
        };
      case 'action.partner_payouts':
        return { 'action.partner_payouts': { limit: 20 } };
      case 'action.partner_subject_stats':
        return {
          'action.partner_subject_stats': {
            subjectUserId: '{{telegram.callback.params[0]}}'
          }
        };

      // Условия
      case 'condition':
        return {
          condition: { variable: 'balance', operator: 'greater', value: 0 }
        };

      // Поток управления
      case 'flow.delay':
        return { 'flow.delay': { delayMs: 1000 } };
      case 'flow.loop':
        return { 'flow.loop': { iterations: 3, iteratorVariable: 'i' } };
      case 'flow.sub_workflow':
        return { 'flow.sub_workflow': { workflowId: 'sub-workflow-id' } };
      case 'flow.jump':
        return { 'flow.jump': { targetNodeId: 'node-123' } };
      case 'flow.end':
        return { 'flow.end': { success: true } };

      // Интеграции
      case 'integration.webhook':
        return {
          'integration.webhook': {
            url: 'https://example.com/webhook',
            method: 'POST'
          }
        };
      case 'integration.analytics':
        return { 'integration.analytics': { event: 'workflow_step' } };

      default:
        return {};
    }
  };

  // Handle connections
  const onConnect = useCallback(
    (params: Connection) => {
      // Блокируем создание связей, если нет выбранного workflow
      if (!currentWorkflow) {
        return;
      }

      const newEdge: Edge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'default',
        animated: true
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, currentWorkflow]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
      setSelectedNode(node as WorkflowNode);
    },
    []
  );

  // Handle pane click (deselect node and close context menu)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  // Handle node updates from properties panel
  const onNodeUpdate = useCallback(
    (updatedNode: WorkflowNode) => {
      // Блокируем обновление нод, если нет выбранного workflow
      if (!currentWorkflow) {
        return;
      }

      setNodes((nds) =>
        nds.map((node) => (node.id === updatedNode.id ? updatedNode : node))
      );
      setSelectedNode(updatedNode);
    },
    [setNodes, currentWorkflow]
  );

  // Save current workflow
  const handleSaveWorkflow = useCallback(async () => {
    if (currentWorkflow) {
      setIsSaving(true);
      try {
        const updatedWorkflow: Workflow = {
          ...currentWorkflow,
          nodes: nodes,
          connections: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: (edge.type as WorkflowConnectionType) || 'default',
            animated: edge.animated,
            style: edge.style
          })) as any // Cast to match expected type
        };
        await saveWorkflow(updatedWorkflow);
        toast({
          title: 'Сохранено',
          description: `Workflow "${currentWorkflow.name}" успешно сохранён`
        });
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось сохранить workflow',
          variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
    }
  }, [currentWorkflow, nodes, edges, saveWorkflow, toast]);

  // Toggle workflow active state
  const handleToggleActive = useCallback(
    async (workflowId: string, isActive: boolean) => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/workflows/${workflowId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isActive
            })
          }
        );

        if (!response.ok) {
          throw new Error('Failed to toggle workflow active state');
        }

        const result = await response.json();

        // Обновляем текущий workflow
        if (currentWorkflow && currentWorkflow.id === workflowId) {
          setCurrentWorkflow({ ...currentWorkflow, isActive });
        }

        // Обновляем список workflow
        await loadWorkflows();

        console.log('Workflow active state updated:', result.workflow);
      } catch (error) {
        console.error('Error toggling workflow active state:', error);
      }
    },
    [projectId, currentWorkflow, loadWorkflows, setCurrentWorkflow]
  );

  // Context menu handlers
  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const onEdgeContextMenu: EdgeMouseHandler = useCallback((event, edge) => {
    event.preventDefault();
    setContextMenu({
      edgeId: edge.id,
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nodes) => nodes.filter((n) => n.id !== nodeId));
      setEdges((edges) =>
        edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      setContextMenu(null);
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((edges) => edges.filter((e) => e.id !== edgeId));
      setContextMenu(null);
    },
    [setEdges]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (nodeToDuplicate) {
        const newNode: WorkflowNode = {
          ...nodeToDuplicate,
          id: `${nodeToDuplicate.type}-${Date.now()}`,
          position: {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50
          },
          data: {
            ...nodeToDuplicate.data,
            label: `${nodeToDuplicate.data.label} (копия)`
          }
        };
        setNodes((nodes) => [...nodes, newNode]);
      }
      setContextMenu(null);
    },
    [nodes, setNodes]
  );

  // Data for ReactFlow
  const flowData = useMemo(
    () => ({
      nodes: nodes,
      edges: edges
    }),
    [nodes, edges]
  );

  // Проверка наличия workflow
  const hasNoWorkflow =
    !isLoading && !currentWorkflow && workflows.length === 0;

  return (
    <div className='flex h-[calc(100vh-80px)] flex-col overflow-hidden'>
      {/* Header */}
      <div className='flex-shrink-0'>
        <WorkflowHeader
          projectId={projectId}
          workflows={workflows}
          currentWorkflow={currentWorkflow}
          selectedWorkflowId={selectedWorkflowId}
          onWorkflowSelect={setSelectedWorkflowId}
          onWorkflowCreate={createWorkflow}
          onWorkflowLoad={loadWorkflow}
          onWorkflowSave={handleSaveWorkflow}
          onWorkflowDelete={deleteWorkflow}
          onWorkflowExport={exportWorkflow}
          onWorkflowImport={importWorkflow}
          onWorkflowToggleActive={handleToggleActive}
          isSaving={isSaving}
        />
      </div>

      {/* Main content */}
      <div className='relative flex flex-1 overflow-hidden'>
        {/* Canvas */}
        <div className='h-full w-full flex-1'>
          {/* Блокирующий overlay, если нет workflow */}
          {hasNoWorkflow && (
            <div className='bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
              <div className='bg-background max-w-md space-y-4 rounded-lg border p-8 text-center shadow-lg'>
                <h3 className='text-xl font-semibold'>Нет workflow</h3>
                <p className='text-muted-foreground'>
                  Для работы с конструктором необходимо создать или выбрать
                  workflow. Используйте кнопку "Выберите workflow" в заголовке
                  для создания или загрузки workflow.
                </p>
              </div>
            </div>
          )}
          {/* Left panel Container */}
          <div className='pointer-events-none absolute top-4 bottom-24 left-4 z-10 flex w-[260px] flex-col gap-4'>
            <div className='pointer-events-auto flex min-h-0 flex-1'>
              <WorkflowToolbar
                onAddNode={handleAddNode}
                className='min-h-0 flex-1'
              />
            </div>
            {validationResult && (
              <div className='pointer-events-auto mb-2 w-full shrink-0'>
                <WorkflowValidationPanel
                  result={validationResult}
                  onFocusNode={handleFocusNode}
                  className='w-full'
                />
              </div>
            )}
          </div>
          {/* Auto layout button */}
          <div className='absolute top-4 right-4 z-[5]'>
            <Button
              variant='outline'
              size='sm'
              onClick={onAutoLayout}
              disabled={nodes.length === 0}
              title='Автоматическое выравнивание нод'
            >
              <AlignVerticalJustifyCenter className='mr-2 h-4 w-4' />
              Выравнять
            </Button>
          </div>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className='h-full w-full'
          >
            <ReactFlow
              nodes={flowData.nodes}
              edges={flowData.edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={currentWorkflow ? onConnect : undefined}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeContextMenu={
                currentWorkflow ? onNodeContextMenu : undefined
              }
              onEdgeContextMenu={
                currentWorkflow ? onEdgeContextMenu : undefined
              }
              onInit={setReactFlowInstance}
              nodeTypes={workflowNodeTypes}
              fitView
              attributionPosition='bottom-right'
              className='h-full w-full'
              nodesDraggable={!!currentWorkflow}
              nodesConnectable={!!currentWorkflow}
              elementsSelectable={!!currentWorkflow}
            >
              {/* Properties panel */}
              <Background variant={BackgroundVariant.Dots} />
              <Controls />
              <MiniMap
                className='!bg-background !border-border'
                maskColor='rgba(0, 0, 0, 0.2)'
                nodeColor={(node) => {
                  switch (node.type) {
                    case 'trigger.command':
                    case 'trigger.message':
                    case 'trigger.callback':
                    case 'trigger.webhook':
                    case 'trigger.schedule':
                    case 'trigger.contact':
                      return '#22c55e';
                    case 'message':
                      return '#3b82f6';
                    case 'condition':
                      return '#f97316';
                    case 'flow.delay':
                    case 'flow.end':
                      return '#8b5cf6';
                    default:
                      return '#a855f7';
                  }
                }}
              />

              {/* Properties panel */}
              {selectedNode && (
                <WorkflowProperties
                  node={selectedNode}
                  onNodeUpdate={onNodeUpdate}
                  onClose={() => setSelectedNode(null)}
                  allNodes={nodes}
                  projectId={projectId}
                  workflowId={currentWorkflow?.id}
                />
              )}
            </ReactFlow>
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className='bg-background min-w-[150px] rounded-md border p-1 shadow-lg'>
            {contextMenu.nodeId && (
              <>
                <button
                  onClick={() => handleDuplicateNode(contextMenu.nodeId!)}
                  className='hover:bg-accent flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors'
                >
                  <Copy className='h-4 w-4' />
                  Дублировать
                </button>
                <button
                  onClick={() => handleDeleteNode(contextMenu.nodeId!)}
                  className='text-destructive hover:bg-accent flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors'
                >
                  <Trash2 className='h-4 w-4' />
                  Удалить ноду
                </button>
              </>
            )}
            {contextMenu.edgeId && (
              <button
                onClick={() => handleDeleteEdge(contextMenu.edgeId!)}
                className='text-destructive hover:bg-accent flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors'
              >
                <Trash2 className='h-4 w-4' />
                Удалить связь
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
