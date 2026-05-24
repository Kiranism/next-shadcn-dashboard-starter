/**
 * @file: src/lib/services/workflow/handlers/index.ts
 * @description: Экспорт всех обработчиков нод и функция инициализации
 * @project: SaaS Bonus System
 * @dependencies: Node handlers, Registry
 * @created: 2025-01-13
 * @author: AI Assistant + User
 */

import { nodeHandlersRegistry } from '../node-handlers-registry';

// Import handlers
import {
  CommandTriggerHandler,
  MessageTriggerHandler,
  CallbackTriggerHandler,
  WebhookTriggerHandler,
  ContactTriggerHandler
} from './trigger-handlers';

import { MessageHandler } from './message-handler';

import {
  DatabaseQueryHandler,
  SetVariableHandler,
  GetVariableHandler,
  RequestContactHandler,
  ApiRequestHandler,
  SendNotificationHandler,
  CheckUserLinkedHandler,
  FindUserByContactHandler,
  LinkTelegramAccountHandler,
  GetUserBalanceHandler,
  MenuCommandHandler,
  CheckChannelSubscriptionHandler,
  PartnerTeamHandler,
  PartnerSubjectStatsHandler,
  PartnerPayoutsHandler,
  PartnerLinkHandler,
  PartnerOrgSummaryHandler
} from './action-handlers';

import { ConditionHandler } from './condition-handler';

import {
  DelayFlowHandler,
  EndFlowHandler,
  LoopFlowHandler,
  SubWorkflowFlowHandler,
  JumpFlowHandler
} from './flow-handlers';

import {
  InlineKeyboardHandler,
  ReplyKeyboardHandler
} from './keyboard-handler';

import {
  PhotoMessageHandler,
  VideoMessageHandler,
  DocumentMessageHandler,
  EditMessageHandler,
  DeleteMessageHandler
} from './media-handler';

import { SwitchHandler } from './switch-handler';
import {
  WebhookIntegrationHandler,
  AnalyticsIntegrationHandler
} from './integration-handlers';

/**
 * Инициализирует и регистрирует все обработчики нод
 */
export function initializeNodeHandlers(): void {
  // Trigger handlers
  nodeHandlersRegistry.register(new CommandTriggerHandler());
  nodeHandlersRegistry.register(new MessageTriggerHandler());
  nodeHandlersRegistry.register(new CallbackTriggerHandler());
  nodeHandlersRegistry.register(new WebhookTriggerHandler());
  nodeHandlersRegistry.register(new ContactTriggerHandler());

  // Message handlers
  nodeHandlersRegistry.register(new MessageHandler());
  nodeHandlersRegistry.register(new InlineKeyboardHandler());
  nodeHandlersRegistry.register(new ReplyKeyboardHandler());
  nodeHandlersRegistry.register(new PhotoMessageHandler());
  nodeHandlersRegistry.register(new VideoMessageHandler());
  nodeHandlersRegistry.register(new DocumentMessageHandler());
  nodeHandlersRegistry.register(new EditMessageHandler());
  nodeHandlersRegistry.register(new DeleteMessageHandler());

  // Action handlers
  nodeHandlersRegistry.register(new ApiRequestHandler());
  nodeHandlersRegistry.register(new DatabaseQueryHandler());
  nodeHandlersRegistry.register(new SetVariableHandler());
  nodeHandlersRegistry.register(new GetVariableHandler());
  nodeHandlersRegistry.register(new RequestContactHandler());
  nodeHandlersRegistry.register(new SendNotificationHandler());
  nodeHandlersRegistry.register(new CheckUserLinkedHandler());
  nodeHandlersRegistry.register(new FindUserByContactHandler());
  nodeHandlersRegistry.register(new LinkTelegramAccountHandler());
  nodeHandlersRegistry.register(new GetUserBalanceHandler());
  nodeHandlersRegistry.register(new CheckChannelSubscriptionHandler());
  // ✨ Phase 4: Partner Cabinet handlers (b2b-иерархия)
  nodeHandlersRegistry.register(new PartnerTeamHandler());
  nodeHandlersRegistry.register(new PartnerSubjectStatsHandler());
  nodeHandlersRegistry.register(new PartnerPayoutsHandler());
  nodeHandlersRegistry.register(new PartnerLinkHandler());
  nodeHandlersRegistry.register(new PartnerOrgSummaryHandler());

  const menuHandler = new MenuCommandHandler();
  nodeHandlersRegistry.register(menuHandler);
  console.log(
    `✅ Registered MenuCommandHandler: ${menuHandler.constructor.name}`
  );

  // Condition handlers
  nodeHandlersRegistry.register(new ConditionHandler());
  nodeHandlersRegistry.register(new SwitchHandler());

  // Flow handlers
  nodeHandlersRegistry.register(new DelayFlowHandler());
  nodeHandlersRegistry.register(new EndFlowHandler());
  nodeHandlersRegistry.register(new LoopFlowHandler());
  nodeHandlersRegistry.register(new SubWorkflowFlowHandler());
  nodeHandlersRegistry.register(new JumpFlowHandler());
  nodeHandlersRegistry.register(new WebhookIntegrationHandler());
  nodeHandlersRegistry.register(new AnalyticsIntegrationHandler());

  console.log('✅ All node handlers initialized and registered');
}

// Export handlers for direct use if needed
export {
  CommandTriggerHandler,
  MessageTriggerHandler,
  CallbackTriggerHandler,
  WebhookTriggerHandler,
  ContactTriggerHandler,
  MessageHandler,
  ApiRequestHandler,
  DatabaseQueryHandler,
  SetVariableHandler,
  GetVariableHandler,
  RequestContactHandler,
  SendNotificationHandler,
  CheckUserLinkedHandler,
  FindUserByContactHandler,
  LinkTelegramAccountHandler,
  GetUserBalanceHandler,
  MenuCommandHandler,
  CheckChannelSubscriptionHandler,
  PartnerTeamHandler,
  PartnerSubjectStatsHandler,
  PartnerPayoutsHandler,
  PartnerLinkHandler,
  PartnerOrgSummaryHandler,
  ConditionHandler,
  DelayFlowHandler,
  EndFlowHandler,
  LoopFlowHandler,
  SubWorkflowFlowHandler,
  JumpFlowHandler,
  WebhookIntegrationHandler,
  AnalyticsIntegrationHandler
};
