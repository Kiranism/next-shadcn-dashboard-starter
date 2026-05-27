/**
 * @file: src/lib/services/simple-workflow-processor.ts
 * @description: Обработчик workflow с использованием Node Handlers Registry
 * @project: SaaS Bonus System
 * @dependencies: Node Handlers Registry, Execution Context Manager
 * @created: 2025-10-12
 * @author: AI Assistant + User
 */

import { Context } from 'grammy';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { nodeHandlersRegistry } from './workflow/node-handlers-registry';
import { ExecutionContextManager } from './workflow/execution-context-manager';
import { RateLimiterService } from './rate-limiter.service';
import type {
  Workflow,
  WorkflowVersion,
  ExecutionContext,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowConnection,
  HandlerResult
} from '@/types/workflow';

/**
 * Обработчик workflow с использованием Node Handlers Registry
 */
export class SimpleWorkflowProcessor {
  private workflowVersion: WorkflowVersion;
  private projectId: string;
  private nodesMap: Map<string, WorkflowNode>;
  private connectionsMap: Map<string, WorkflowConnection>;
  private currentContext: ExecutionContext | null = null;

  constructor(workflowVersion: WorkflowVersion, projectId: string) {
    this.workflowVersion = workflowVersion;
    this.projectId = projectId;

    // Индексируем ноды для быстрого доступа
    this.nodesMap = new Map();
    Object.entries(workflowVersion.nodes).forEach(([id, node]) => {
      this.nodesMap.set(id, node);
      logger.debug(`📋 Добавлена нода в nodesMap: ${id} (${node.type})`);
    });

    logger.debug(`📋 Всего нод в nodesMap: ${this.nodesMap.size}`);
    logger.debug(`📋 Ключи nodesMap:`, Array.from(this.nodesMap.keys()));

    // Индексируем connections для быстрого доступа
    this.connectionsMap = new Map();
    if (workflowVersion.connections) {
      workflowVersion.connections.forEach((connection) => {
        const key = `${connection.source}->${connection.target}`;
        this.connectionsMap.set(key, connection);
      });
      console.log(
        `📋 SimpleWorkflowProcessor создан: ${this.connectionsMap.size} connections`,
        {
          projectId: this.projectId,
          workflowId: workflowVersion.workflowId,
          nodesCount: this.nodesMap.size,
          connectionsCount: this.connectionsMap.size,
          menuInviteConnections: Array.from(this.connectionsMap.values())
            .filter((c) => c.source === 'menu-invite-trigger')
            .map((c) => ({ source: c.source, target: c.target }))
        }
      );
    } else {
      console.error(
        '⚠️ CRITICAL: workflowVersion.connections is null or undefined',
        {
          projectId: this.projectId,
          workflowId: workflowVersion.workflowId,
          hasConnections: !!workflowVersion.connections,
          connectionsType: typeof workflowVersion.connections
        }
      );
    }
  }

  /**
   * Обработка входящего сообщения/команды
   */
  async process(
    ctx: Context,
    trigger: 'start' | 'message' | 'callback'
  ): Promise<boolean> {
    const processStartTime = Date.now();
    let context: ExecutionContext | null = null;

    try {
      logger.info('🎯 Начало обработки workflow', {
        projectId: this.projectId,
        workflowId: this.workflowVersion.workflowId,
        version: this.workflowVersion.version,
        trigger,
        userId: ctx.from?.id,
        username: ctx.from?.username,
        totalNodes: this.nodesMap.size
      });

      // Создаем контекст выполнения
      const telegramUserId = ctx.from?.id?.toString();
      const chatId = ctx.chat?.id?.toString();

      // ✅ Rate limiting: проверка лимита для Telegram сообщений
      if (telegramUserId) {
        const messageLimit = await RateLimiterService.checkLimit(
          'TELEGRAM_MESSAGE',
          telegramUserId
        );

        if (!messageLimit.allowed) {
          logger.warn('Telegram message rate limit exceeded', {
            telegramUserId,
            projectId: this.projectId,
            remaining: messageLimit.remaining,
            retryAfter: messageLimit.retryAfter
          });

          // Отправляем пользователю сообщение о превышении лимита
          try {
            await ctx.reply(
              '⚠️ Слишком много запросов. Пожалуйста, подождите немного перед следующим запросом.'
            );
          } catch (replyError) {
            logger.error('Failed to send rate limit message', {
              error:
                replyError instanceof Error
                  ? replyError.message
                  : String(replyError)
            });
          }

          return false;
        }
      }

      // ✅ Rate limiting: проверка лимита для workflow execution (per user)
      if (telegramUserId) {
        const workflowLimit = await RateLimiterService.checkLimit(
          'WORKFLOW_EXECUTION',
          `${this.projectId}:${telegramUserId}`
        );

        if (!workflowLimit.allowed) {
          logger.warn('Workflow execution rate limit exceeded', {
            telegramUserId,
            projectId: this.projectId,
            remaining: workflowLimit.remaining,
            retryAfter: workflowLimit.retryAfter
          });

          // Отправляем пользователю сообщение
          try {
            await ctx.reply(
              '⚠️ Превышен лимит выполнения сценариев. Попробуйте позже.'
            );
          } catch (replyError) {
            logger.error('Failed to send workflow rate limit message', {
              error:
                replyError instanceof Error
                  ? replyError.message
                  : String(replyError)
            });
          }

          return false;
        }
      }

      // Находим пользователя в базе данных по Telegram ID
      let userId: string | undefined;
      if (telegramUserId) {
        try {
          logger.debug('Looking for user by telegram ID', {
            telegramUserId,
            projectId: this.projectId
          });

          const user = await db.user.findFirst({
            where: {
              telegramId: BigInt(telegramUserId),
              projectId: this.projectId
            },
            select: { id: true }
          });

          userId = user?.id;
          logger.debug('User lookup result', {
            telegramUserId,
            userId,
            found: !!user
          });
        } catch (error) {
          logger.warn('Failed to find user by telegram ID', {
            telegramUserId,
            error
          });
        }
      } else {
        logger.debug('No telegramUserId provided, skipping user lookup');
      }

      // Извлекаем contact из сообщения если есть
      const contact = ctx.message?.contact
        ? {
            phoneNumber: ctx.message.contact.phone_number,
            firstName: ctx.message.contact.first_name,
            lastName: ctx.message.contact.last_name,
            telegramUserId: ctx.message.contact.user_id?.toString()
          }
        : undefined;

      // ✅ Используем новый метод getOrCreateSessionId для корректной работы с сессиями
      const sessionId = await this.getOrCreateSessionId(ctx);

      const contextStartTime = Date.now();
      context = await ExecutionContextManager.createContext(
        this.projectId,
        this.workflowVersion.workflowId,
        this.workflowVersion.version,
        sessionId,
        userId, // Теперь это ID пользователя из БД, а не Telegram ID
        chatId,
        telegramUserId, // Telegram ID передаем отдельно
        ctx.from?.username,
        ctx.message?.text,
        ctx.callbackQuery?.data,
        contact, // Передаём contact
        (ctx as any)._platform || 'telegram',
        ctx // Передаём сырой контекст платформы
      );
      logger.info(
        `🚀 [PERF] Context creation took ${Date.now() - contextStartTime}ms`,
        {
          executionId: context.executionId,
          projectId: this.projectId
        }
      );

      // ✅ КРИТИЧНО: Сохраняем callbackQueryId для answerCallbackQuery
      if (ctx.callbackQuery?.id) {
        (context as any).callbackQueryId = ctx.callbackQuery.id;
      }

      // Находим стартовую ноду по триггеру
      logger.debug('Finding trigger node', {
        trigger,
        hasCallback: !!ctx.callbackQuery,
        callbackData: ctx.callbackQuery?.data
      });
      const triggerNodeStartTime = Date.now();
      const startNode = this.findTriggerNode(trigger, ctx);
      logger.info(
        `🚀 [PERF] findTriggerNode took ${Date.now() - triggerNodeStartTime}ms`,
        {
          startNodeId: startNode?.id,
          executionId: context.executionId
        }
      );

      if (!startNode) {
        logger.debug('CRITICAL: No start node found', {});
        logger.warn('⚠️ Стартовая нода не найдена', {
          projectId: this.projectId,
          workflowId: this.workflowVersion.workflowId,
          trigger,
          hasContact: !!ctx.message?.contact,
          hasCallback: !!ctx.callbackQuery,
          callbackData: ctx.callbackQuery?.data,
          availableNodeTypes: Array.from(this.nodesMap.values()).map(
            (n: any) => n.type
          )
        });
        return false;
      }

      logger.info('🚀 Запуск выполнения workflow', {
        projectId: this.projectId,
        executionId: context.executionId,
        startNodeId: startNode.id,
        startNodeLabel: startNode.data?.label
      });

      logger.debug('Starting workflow execution with node', {
        nodeId: startNode.id
      });

      // Выполняем workflow начиная со стартовой ноды
      try {
        await this.executeWorkflow(context, startNode.id);
        logger.debug('Workflow execution loop completed successfully', {});
      } catch (executionError) {
        console.error('Workflow execution failed:', {
          error:
            executionError instanceof Error
              ? executionError.message
              : 'Unknown execution error',
          nodeId: startNode.id
        });
        throw executionError;
      }

      // ✅ Проверяем, не перешел ли workflow в состояние waiting
      try {
        const execution = await db.workflowExecution.findUnique({
          where: { id: context.executionId },
          select: { status: true, waitType: true, currentNodeId: true }
        });

        if (execution?.status === 'waiting') {
          logger.info('⏸️ Workflow execution paused (waiting state detected)', {
            executionId: context.executionId,
            waitType: execution.waitType,
            currentNodeId: execution.currentNodeId,
            steps: context.step
          });
          // Не завершаем выполнение — оно будет продолжено позже
          return true;
        }
      } catch (checkError) {
        console.warn('Failed to check execution status after loop', checkError);
      }

      // Завершаем выполнение как completed, если не waiting
      try {
        await ExecutionContextManager.completeExecution(
          context,
          'completed',
          undefined,
          context.step
        );
        logger.debug('Execution completed successfully', {});
      } catch (completeError) {
        console.error(
          'Failed to complete execution, but workflow was successful:',
          completeError
        );
        // Не бросаем ошибку, так как workflow выполнился успешно
      }

      logger.info(
        `✅ [PERF] SimpleWorkflowProcessor.process COMPLETED in ${Date.now() - processStartTime}ms`,
        {
          projectId: this.projectId,
          executionId: context.executionId,
          steps: context.step
        }
      );

      return true;
    } catch (error) {
      // Завершаем выполнение с ошибкой
      if (context) {
        await ExecutionContextManager.completeExecution(
          context,
          'failed',
          error instanceof Error ? error.message : 'Unknown error',
          context.step
        );
      }

      logger.error('❌ Ошибка обработки workflow', {
        projectId: this.projectId,
        workflowId: this.workflowVersion.workflowId,
        executionId: context?.executionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Получает существующий или создает новый ID сессии
   * ✅ ИСПРАВЛЕНИЕ Race Condition: Проверяем активное выполнение для пользователя
   * и используем существующий sessionId, чтобы переменные сохранялись между взаимодействиями
   */
  private async getOrCreateSessionId(ctx: Context): Promise<string> {
    const chatId = ctx.chat?.id || ctx.from?.id || 'unknown';
    const userId = ctx.from?.id || 'unknown';
    const baseSessionId = `${chatId}_${userId}`;

    try {
      // Проверяем активное выполнение для этого пользователя в этом workflow
      const activeExecution = await db.workflowExecution.findFirst({
        where: {
          projectId: this.projectId,
          workflowId: this.workflowVersion.workflowId,
          telegramChatId: chatId.toString(),
          status: { in: ['running', 'waiting'] }
        },
        orderBy: { startedAt: 'desc' },
        select: { sessionId: true, status: true, id: true }
      });

      if (activeExecution?.sessionId) {
        logger.debug('Using existing session from active execution', {
          chatId,
          userId,
          existingSessionId: activeExecution.sessionId,
          executionId: activeExecution.id,
          executionStatus: activeExecution.status
        });
        return activeExecution.sessionId;
      }

      // Нет активного выполнения - создаем новый sessionId
      const newSessionId = `${baseSessionId}_${Date.now()}`;
      logger.debug('Creating new session ID (no active execution)', {
        chatId,
        userId,
        newSessionId
      });

      return newSessionId;
    } catch (error) {
      // В случае ошибки БД - fallback на генерацию нового sessionId
      logger.warn(
        'Failed to check active execution, generating new sessionId',
        {
          chatId,
          userId,
          error: error instanceof Error ? error.message : String(error)
        }
      );
      return `${baseSessionId}_${Date.now()}`;
    }
  }

  /**
   * @deprecated Use getOrCreateSessionId instead
   * Оставлен для обратной совместимости
   */
  private generateSessionId(ctx: Context): string {
    const chatId = ctx.chat?.id || ctx.from?.id || 'unknown';
    const userId = ctx.from?.id || 'unknown';
    return `${chatId}_${userId}_${Date.now()}`;
  }

  /**
   * Продолжает выполнение workflow начиная с указанной ноды
   * Используется для возобновления workflow после waiting состояния
   */
  async resumeWorkflow(
    context: ExecutionContext,
    startNodeId: string
  ): Promise<void> {
    return this.executeWorkflow(context, startNodeId);
  }

  /**
   * Выполняет workflow начиная с указанной ноды
   * ✅ Защита от бесконечных циклов через visitedNodes и maxIterations
   */
  private async executeWorkflow(
    context: ExecutionContext,
    startNodeId: string
  ): Promise<void> {
    logger.debug('EXECUTING WORKFLOW FROM NODE', { nodeId: startNodeId });
    logger.debug('Available nodes', {
      nodes: Array.from(this.nodesMap.keys())
    });

    this.currentContext = context;
    let currentNodeId: string | null = startNodeId;
    let step = 0;

    // ✅ Защита от циклов: отслеживаем посещенные ноды
    const visitedNodes = new Map<string, number>(); // nodeId -> количество посещений
    const MAX_NODE_VISITS = 100; // Максимум 100 посещений одной ноды (для циклов)

    while (currentNodeId && step < context.maxSteps) {
      step++;

      logger.debug('Executing workflow step', { step, nodeId: currentNodeId });

      // ✅ Проверяем количество посещений текущей ноды
      const visitCount = visitedNodes.get(currentNodeId) || 0;
      if (visitCount >= MAX_NODE_VISITS) {
        throw new Error(
          `Infinite loop detected: Node ${currentNodeId} visited ${visitCount} times. ` +
            `Maximum allowed: ${MAX_NODE_VISITS}`
        );
      }
      visitedNodes.set(currentNodeId, visitCount + 1);

      const updatedContext = ExecutionContextManager.updateContextForStep(
        context,
        step,
        currentNodeId,
        'unknown' // Будет обновлено в handler
      );

      const node = this.nodesMap.get(currentNodeId);
      if (!node) {
        console.error(`Node not found: ${currentNodeId}`);
        throw new Error(`Node not found: ${currentNodeId}`);
      }

      // Получаем handler для типа ноды
      const handler = nodeHandlersRegistry.get(node.type as WorkflowNodeType);
      if (!handler) {
        throw new Error(`No handler found for node type: ${node.type}`);
      }

      // Выполняем ноду через handler
      logger.debug('Executing node handler', {
        nodeType: node.type,
        nodeId: currentNodeId
      });
      const nextNodeId = await handler.execute(node, updatedContext);
      logger.debug('Node executed', { nodeId: currentNodeId, nextNodeId });
      context.step = step;

      // ✅ Проверяем на специальный результат ожидания ввода пользователя
      if (
        nextNodeId === '__WAITING_FOR_USER_INPUT__' ||
        nextNodeId === '__WAITING_FOR_CONTACT__'
      ) {
        logger.info('⏸️ Workflow paused waiting for user input', {
          executionId: context.executionId,
          nodeId: currentNodeId,
          step
        });
        // Прерываем выполнение - workflow в состоянии waiting
        return;
      }

      // Определяем следующий нод: сначала используем результат handler'а,
      // если null - ищем по connections
      if (nextNodeId !== null) {
        logger.debug('🔧 Using nextNodeId from handler', {
          currentNodeId,
          nextNodeId
        });
        currentNodeId = nextNodeId;
      } else {
        logger.debug(
          '🔧 Handler returned null, searching for next node via connections',
          {
            currentNodeId,
            connectionsMapSize: this.connectionsMap.size
          }
        );
        currentNodeId = await this.getNextNodeId(currentNodeId);
        logger.debug('🔧 getNextNodeId result', {
          previousNodeId: currentNodeId === null ? 'N/A' : 'found',
          nextNodeId: currentNodeId
        });
      }

      // Если следующий нод не найден, завершаем выполнение
      if (currentNodeId === null) {
        logger.warn('⚠️ No next node found, ending workflow execution', {
          lastNodeId: currentNodeId,
          step,
          connectionsMapSize: this.connectionsMap.size,
          allConnections: Array.from(this.connectionsMap.values()).map((c) => ({
            source: c.source,
            target: c.target
          }))
        });
        break;
      }
    }

    if (step >= context.maxSteps) {
      throw new Error(
        `Maximum steps (${context.maxSteps}) exceeded. ` +
          `This might indicate an infinite loop or overly complex workflow.`
      );
    }

    logger.debug('Workflow completed successfully', { steps: step });
  }

  /**
   * Получает следующий нод по connections
   * ✅ Публичный метод для использования из workflow-runtime.service
   */
  async getNextNodeId(currentNodeId: string): Promise<string | null> {
    // Ищем connection где source - текущий нод
    const relevantConnections = Array.from(this.connectionsMap.values()).filter(
      (connection) => connection.source === currentNodeId
    );

    console.log('🔍 getNextNodeId called', {
      currentNodeId,
      connectionsMapSize: this.connectionsMap.size,
      relevantConnectionsCount: relevantConnections.length,
      relevantConnections: relevantConnections.map((c) => ({
        source: c.source,
        target: c.target
      }))
    });

    if (relevantConnections.length === 0) {
      console.error('⚠️ CRITICAL: No connections found for node', {
        currentNodeId,
        allConnections: Array.from(this.connectionsMap.values()).map((c) => ({
          source: c.source,
          target: c.target
        })),
        allConnectionsRaw:
          this.connectionsMap.size > 0
            ? JSON.stringify(
                Array.from(this.connectionsMap.values()).slice(0, 10)
              )
            : 'EMPTY'
      });
      return null;
    }

    // Если только одна connection, возвращаем её target
    if (relevantConnections.length === 1) {
      const nextNodeId = relevantConnections[0].target;
      logger.debug('✅ Found next node via connection', {
        currentNodeId,
        nextNodeId
      });
      return nextNodeId;
    }

    // Для condition нод проверяем sourceHandle и результат условия
    const currentNode = this.nodesMap.get(currentNodeId);
    if (currentNode?.type === 'condition') {
      logger.debug('Processing condition node', { nodeId: currentNodeId });
      logger.debug('Available connections', {
        connections: relevantConnections.map((c) => ({
          source: c.source,
          target: c.target,
          sourceHandle: (c as any).sourceHandle,
          type: c.type
        }))
      });

      // Получаем результат условия из контекста (должен быть установлен в condition handler)
      const conditionResult = await this.getConditionResultFromContext();

      // Ищем connection с соответствующим sourceHandle
      const expectedHandle = conditionResult ? 'true' : 'false';
      logger.debug('Looking for sourceHandle', { expectedHandle });

      const matchingConnection = relevantConnections.find((conn) => {
        const connSourceHandle = (conn as any).sourceHandle;
        const matches = connSourceHandle === expectedHandle;
        logger.debug('Checking connection', {
          source: conn.source,
          target: conn.target,
          sourceHandle: connSourceHandle,
          matches
        });
        return matches;
      });

      if (matchingConnection) {
        logger.debug('Condition matched', {
          nodeId: currentNodeId,
          result: conditionResult,
          expectedHandle,
          target: matchingConnection.target
        });
        return matchingConnection.target;
      }

      // Если нет подходящей connection, берем default
      const defaultConnection = relevantConnections.find(
        (conn) => conn.type === 'default'
      );
      if (defaultConnection) {
        logger.debug('No matching sourceHandle, using default', {
          target: defaultConnection.target
        });
        return defaultConnection.target;
      }

      logger.warn('No matching connection found for condition', {
        nodeId: currentNodeId,
        result: conditionResult
      });
    }

    // Для остальных случаев возвращаем первый target (для обратной совместимости)
    return relevantConnections[0].target;
  }

  /**
   * Получает результат условия из текущего контекста выполнения
   */
  private async getConditionResultFromContext(): Promise<boolean> {
    if (!this.currentContext) {
      logger.debug('getConditionResultFromContext: no currentContext', {});
      return false; // fallback - если нет контекста, считаем условие false
    }

    try {
      const result = await this.currentContext.variables.get(
        'condition_result',
        'session'
      );
      logger.debug('getConditionResultFromContext: condition_result', {
        result,
        resultType: typeof result
      });

      return Boolean(result);
    } catch (error) {
      logger.debug(
        'getConditionResultFromContext: error getting condition_result',
        { error: String(error) }
      );
      // Если переменная не найдена, возвращаем false
      return false;
    }
  }

  /**
   * Находим триггерную ноду на основе входящего обновления
   * Поддерживает множественные триггеры в одном workflow (как в ManyChat/n8n)
   */
  private findTriggerNode(
    trigger: string,
    ctx?: any
  ): WorkflowNode | undefined {
    // 1️⃣ ПРИОРИТЕТ 1: Проверяем наличие контакта (trigger.contact)
    if (ctx?.message?.contact) {
      const contactTrigger = this.findTriggerByType('trigger.contact');
      if (contactTrigger) {
        logger.info('✅ Найден trigger.contact (контакт получен)', {
          nodeId: contactTrigger.id,
          phone: ctx.message.contact.phone_number
        });
        return contactTrigger;
      }
    }

    // 2️⃣ ПРИОРИТЕТ 2: Проверяем callback query (trigger.callback)
    if (ctx?.callbackQuery) {
      const callbackData = ctx.callbackQuery.data;
      logger.debug('Looking for callback trigger', {
        callbackData,
        availableNodes: Array.from(this.nodesMap.keys())
      });
      const callbackTrigger = this.findCallbackTrigger(callbackData);
      if (callbackTrigger) {
        logger.info('Найден trigger.callback', {
          nodeId: callbackTrigger.id,
          callbackData
        });
        return callbackTrigger;
      } else {
        logger.debug('Callback trigger not found', { callbackData });
        // Возвращаем fallback для неизвестных callback
        const fallbackTrigger = this.findCommandTrigger('/start');
        if (fallbackTrigger) {
          logger.warn('Using /start trigger as fallback for unknown callback', {
            callbackData
          });
          return fallbackTrigger;
        }
      }
    }

    // 3️⃣ ПРИОРИТЕТ 3: Проверяем команду (trigger.command)
    if (trigger === 'start') {
      const commandTrigger = this.findCommandTrigger('/start');
      if (commandTrigger) {
        logger.info('✅ Найден trigger.command для /start', {
          nodeId: commandTrigger.id
        });
        return commandTrigger;
      }
    }

    // 4️⃣ ПРИОРИТЕТ 4: Проверяем обычное сообщение (trigger.message)
    if (trigger === 'message') {
      const messageTrigger = this.findTriggerByType('trigger.message');
      if (messageTrigger) {
        logger.info('✅ Найден trigger.message', { nodeId: messageTrigger.id });
        return messageTrigger;
      }
    }

    // 5️⃣ ПРИОРИТЕТ 5: Fallback на entry_node_id
    if (this.workflowVersion.entryNodeId) {
      const entryNode = this.nodesMap.get(this.workflowVersion.entryNodeId);
      if (entryNode) {
        logger.info('✅ Используем entry node как fallback', {
          nodeId: entryNode.id,
          nodeType: entryNode.type
        });
        return entryNode;
      }
    }

    logger.warn('❌ Trigger нода не найдена', {
      trigger,
      hasContact: !!ctx?.message?.contact,
      hasCallback: !!ctx?.callbackQuery,
      entryNodeId: this.workflowVersion.entryNodeId,
      availableNodes: Array.from(this.nodesMap.values()).map((n: any) => ({
        id: n.id,
        type: n.type,
        label: n.data?.label
      }))
    });

    return undefined;
  }

  /**
   * Поиск триггера по типу
   */
  private findTriggerByType(type: string): WorkflowNode | undefined {
    for (const node of Array.from(this.nodesMap.values())) {
      // Scheduled-триггеры не активируются по входящим событиям (только из cron-runner)
      if (node.type === 'trigger.schedule') continue;
      if (node.type === type) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Поиск trigger.command по команде
   */
  private findCommandTrigger(command: string): WorkflowNode | undefined {
    logger.debug('findCommandTrigger searching', { command });

    for (const [nodeId, node] of Array.from(this.nodesMap.entries())) {
      logger.debug('Checking node', { nodeId, nodeType: node.type });

      if (node.type === 'trigger.command') {
        const config = node.data?.config?.['trigger.command'];
        logger.debug('Config check', {
          config: config ? JSON.stringify(config) : null
        });

        if (config?.command === command) {
          logger.debug('Command found', { command, nodeId: node.id });
          // Возвращаем ноду с правильным ID для nodesMap
          return { ...node, id: nodeId };
        }
      }
    }

    logger.debug('Command not found', { command });
    return undefined;
  }

  /**
   * Поиск trigger.callback по callback_data
   */
  private findCallbackTrigger(callbackData: string): WorkflowNode | undefined {
    logger.debug('findCallbackTrigger searching', {
      callbackData,
      nodeCount: this.nodesMap.size
    });

    for (const node of Array.from(this.nodesMap.values())) {
      logger.debug('Checking node', {
        id: node.id,
        type: node.type,
        hasConfig: !!node.data?.config,
        hasTriggerCallback: !!node.data?.config?.['trigger.callback'],
        callbackData: node.data?.config?.['trigger.callback']?.callbackData
      });

      if (node.type === 'trigger.callback') {
        const config = node.data?.config?.['trigger.callback'];
        logger.debug('Node config', { config });

        if (config?.callbackData === callbackData) {
          logger.debug('Matching callback trigger found', { nodeId: node.id });
          return node;
        }
      }
    }
    logger.debug('No callback trigger found', { callbackData });
    return undefined;
  }
}
