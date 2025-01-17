import {MessageHandler} from '../../src/handlers/message-handler.ts';
import SpyObj = jasmine.SpyObj;
import {Logger} from '../../src/utils/logger.ts';
import {MessageUtils} from '../../src/utils/message-utils.ts';
import createSpyObj = jasmine.createSpyObj;
import {Client, Guild, GuildMember, Message, MessageMentions} from 'discord.js';

describe('MessageHandler', () => {
  let mockLogger: SpyObj<Logger>;
  let mockMessageUtils: SpyObj<MessageUtils>;
  let messageHandler: MessageHandler;

  beforeEach(() => {
    mockLogger = createSpyObj('mockLogger', ['debug', 'info', 'warn', 'error']);
    mockMessageUtils = createSpyObj('mockMessageUtils', ['addReaction']);
    messageHandler = new MessageHandler(mockLogger, mockMessageUtils);
  });

  describe('handleEvent', () => {
    const cybertUserId = 'cybertUserId';

    let mockClient: SpyObj<Client>;
    let mockCybertGuildMember: SpyObj<GuildMember>;
    let mockGuild: SpyObj<Guild>;
    let mockMessageMentions: SpyObj<MessageMentions>;

    beforeEach(() => {
      mockClient = createSpyObj('mockClient', [], {
        user: {
          id: cybertUserId
        }
      });
      mockCybertGuildMember = createSpyObj('mockCybertGuildMember', [], {id: cybertUserId});
      mockGuild = createSpyObj('mockGuild', [], {
        members: {
          me: mockCybertGuildMember
        }
      });
      mockMessageMentions = createSpyObj('mockMessageMentions', ['has']);
      mockMessageMentions.has.and.returnValue(false);
    });

    it('should add a reaction if the message is not from CyBert and is robot-themed', () => {
      const mockMessage: Message = createSpyObj('mockMessage', [], {
        author: {
          id: 'notCybertUserId'
        },
        content: 'This message mentions a robot.',
        mentions: mockMessageMentions,
        guild: mockGuild,
        client: mockClient
      });

      messageHandler.handleEvent(mockMessage);

      expect(mockMessageUtils.addReaction).toHaveBeenCalledOnceWith(mockMessage);
    });

    it('should add a reaction if the message is not from CyBert and mentions CyBert', () => {
      mockMessageMentions.has.and.callFake((guildMember, options) => {
        if (guildMember == mockCybertGuildMember && options?.ignoreRoles && options?.ignoreEveryone) {
          return true;
        } else {
          return false;
        }
      });

      const mockMessage: Message = createSpyObj('mockMessage', [], {
        author: {
          id: 'notCybertUserId'
        },
        content: 'Message.',
        mentions: mockMessageMentions,
        guild: mockGuild,
        client: mockClient
      });

      messageHandler.handleEvent(mockMessage);

      expect(mockMessageUtils.addReaction).toHaveBeenCalledOnceWith(mockMessage);
    });

    it('should not add a reaction if the message is from CyBert', () => {
      const mockMessage: Message = createSpyObj('mockMessage', [], {
        author: {
          id: cybertUserId
        },
        content: 'This message mentions a robot.',
        mentions: mockMessageMentions,
        guild: mockGuild,
        client: mockClient
      });

      messageHandler.handleEvent(mockMessage);

      expect(mockMessageUtils.addReaction).not.toHaveBeenCalled();
    });

    it('should not add a reaction if the message is not robot-themed and does not mention CyBert', () => {
      const mockMessage: Message = createSpyObj('mockMessage', [], {
        author: {
          id: 'notCybertUserId'
        },
        content: 'This is just an ordinary message.',
        mentions: mockMessageMentions,
        guild: mockGuild,
        client: mockClient
      });

      messageHandler.handleEvent(mockMessage);

      expect(mockMessageUtils.addReaction).not.toHaveBeenCalled();
    });

    it('should write an error log if MessageUtils.addReaction throws an error', () => {
      const error = new Error('errorMessage');
      mockMessageUtils.addReaction.and.throwError(error);

      const mockMessage: Message = createSpyObj('mockMessage', [], {
        id: 'messageId',
        author: {
          id: 'notCybertUserId'
        },
        content: 'This message mentions a robot.',
        mentions: mockMessageMentions,
        guild: mockGuild,
        client: mockClient
      });

      messageHandler.handleEvent(mockMessage);

      expect(mockLogger.error).toHaveBeenCalledOnceWith('Unable to add reaction to message.', error, {
        messageId: mockMessage.id,
        authorId: mockMessage.author.id
      });
    });
  });
});
