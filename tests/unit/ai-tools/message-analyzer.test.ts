// Unit tests for MessageAnalyzer
import { MessageAnalyzerMinimal } from '../../../supabase/shared/ai-tools/message-analyzer-minimal.ts';
import { TEST_CONFIG, TEST_DATA, TEST_UTILS } from '../../config/test-env.ts';

describe('MessageAnalyzerMinimal', () => {
  const testUserId = TEST_CONFIG.testUserId;
  const platform = 'whatsapp' as const;

  describe('analyzeMessageForTools', () => {
    test('should detect goal-setting intent', async () => {
      const message = TEST_DATA.messages.goalSetting;
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        message,
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(true);
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].tool_name).toBe('manage_goal');
    });

    test('should handle simple motivation requests without tools', async () => {
      const message = TEST_DATA.messages.motivation;
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        message,
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(false);
      expect(result.tools).toHaveLength(0);
    });

    test('should detect personality switching intent', async () => {
      const message = TEST_DATA.messages.personalitySwitch;
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        message,
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(true);
      expect(result.tools.some(tool => tool.tool_name === 'manage_preferences')).toBe(true);
    });

    test('should handle simple greetings without tools', async () => {
      const message = TEST_DATA.messages.simpleGreeting;
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        message,
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(false);
      expect(result.tools).toHaveLength(0);
    });

    test('should include conversation context when provided', async () => {
      const message = TEST_DATA.messages.progress;
      const context = 'Previous: User set goal to workout 3 times a week';
      
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        message,
        testUserId,
        platform,
        context
      );

      // Should detect progress tracking intent
      expect(result.requiresTools).toBe(true);
      expect(result.tools.some(tool => tool.tool_name === 'track_progress')).toBe(true);
    });
  });

  describe('performance', () => {
    test('should complete analysis within performance target', async () => {
      const message = TEST_DATA.messages.goalSetting;
      
      const { duration } = await TEST_UTILS.measureTime(async () => {
        await MessageAnalyzerMinimal.analyzeMessageForTools(
          message,
          testUserId,
          platform
        );
      });

      expect(duration).toBeLessThan(TEST_CONFIG.performanceTargets.responseTime);
    });

    test('should handle concurrent analysis requests', async () => {
      const messages = [
        TEST_DATA.messages.motivation,
        TEST_DATA.messages.goalSetting,
        TEST_DATA.messages.progress,
        TEST_DATA.messages.personalitySwitch
      ];

      const promises = messages.map(message =>
        MessageAnalyzerMinimal.analyzeMessageForTools(
          message,
          testUserId,
          platform
        )
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toHaveProperty('requiresTools');
        expect(result).toHaveProperty('tools');
        expect(Array.isArray(result.tools)).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    test('should handle empty message gracefully', async () => {
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        '',
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(false);
      expect(result.tools).toHaveLength(0);
    });

    test('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        longMessage,
        testUserId,
        platform
      );

      expect(result).toHaveProperty('requiresTools');
      expect(result).toHaveProperty('tools');
    });

    test('should handle special characters and emojis', async () => {
      const messageWithEmojis = 'I want to 💪 workout 3 times a week 🎯';
      
      const result = await MessageAnalyzerMinimal.analyzeMessageForTools(
        messageWithEmojis,
        testUserId,
        platform
      );

      expect(result.requiresTools).toBe(true);
      expect(result.tools.some(tool => tool.tool_name === 'manage_goal')).toBe(true);
    });
  });
}); 