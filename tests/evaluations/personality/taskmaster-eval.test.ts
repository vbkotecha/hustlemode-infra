// Evaluation tests for Taskmaster Personality
import { generateAIResponse } from '../../../supabase/shared/ai-response.ts';
import { TEST_CONFIG, TEST_DATA, TEST_UTILS } from '../../config/test-env.ts';

// Helper function to evaluate taskmaster response characteristics
async function evaluateTaskmasterResponse(response: string, scenario: string) {
  const wordCount = response.split(' ').length;
  const hasTaskmasterEmojis = TEST_DATA.responsePatterns.taskmaster.emojis.some(emoji => 
    response.includes(emoji)
  );
  const hasActionWords = TEST_DATA.responsePatterns.taskmaster.keywords.some(word => 
    response.toLowerCase().includes(word)
  );
  const hasMotivationalTone = /go|do|work|push|move|start|begin|execute|get|make/i.test(response);
  
  return {
    wordCount,
    hasTaskmasterEmojis,
    hasActionWords,
    hasMotivationalTone,
    toneScore: (hasTaskmasterEmojis ? 0.3 : 0) + (hasActionWords ? 0.4 : 0) + (hasMotivationalTone ? 0.3 : 0),
    motivationLevel: hasMotivationalTone ? 0.9 : 0.3,
    actionOrientation: hasActionWords ? 0.9 : 0.2
  };
}

describe('Taskmaster Personality Evaluation', () => {
  const testUserId = TEST_CONFIG.testUserId;

  describe('tone consistency', () => {
    test('should maintain consistent taskmaster tone across scenarios', async () => {
      const scenarios = [
        'I need motivation',
        'I failed my workout',
        'I want to give up',
        'I achieved my goal',
        'I am feeling lazy today'
      ];

      for (const scenario of scenarios) {
        const response = await generateAIResponse(scenario, testUserId, 'taskmaster');
        
        // Evaluate response characteristics
        const evaluation = await evaluateTaskmasterResponse(response, scenario);
        
        expect(evaluation.toneScore).toBeGreaterThan(0.7);
        expect(evaluation.motivationLevel).toBeGreaterThan(0.7);
        expect(evaluation.actionOrientation).toBeGreaterThan(0.7);
        expect(evaluation.wordCount).toBeLessThanOrEqual(TEST_CONFIG.qualityThresholds.wordCountMax);
        expect(evaluation.wordCount).toBeGreaterThanOrEqual(TEST_CONFIG.qualityThresholds.wordCountMin);
      }
    });

    test('should use appropriate taskmaster emojis', async () => {
      const response = await generateAIResponse('I need motivation', testUserId, 'taskmaster');
      const evaluation = await evaluateTaskmasterResponse(response, 'motivation');
      
      expect(evaluation.hasTaskmasterEmojis).toBe(true);
      expect(response).toMatch(/💪|🔥|⚡/);
    });

    test('should be action-oriented and direct', async () => {
      const response = await generateAIResponse('I am feeling unmotivated', testUserId, 'taskmaster');
      const evaluation = await evaluateTaskmasterResponse(response, 'unmotivated');
      
      expect(evaluation.hasActionWords).toBe(true);
      expect(evaluation.actionOrientation).toBeGreaterThan(0.8);
    });
  });

  describe('response quality', () => {
    test('should maintain 4-12 word constraint', async () => {
      const testMessages = [
        'I need motivation',
        'I want to workout',
        'I am tired',
        'Help me get started',
        'I feel stuck'
      ];
      
      for (const message of testMessages) {
        const response = await generateAIResponse(message, testUserId, 'taskmaster');
        const wordCount = response.split(' ').length;
        
        expect(wordCount).toBeGreaterThanOrEqual(TEST_CONFIG.qualityThresholds.wordCountMin);
        expect(wordCount).toBeLessThanOrEqual(TEST_CONFIG.qualityThresholds.wordCountMax);
      }
    });

    test('should avoid being overly verbose', async () => {
      const response = await generateAIResponse('I need help staying motivated', testUserId, 'taskmaster');
      const wordCount = response.split(' ').length;
      
      expect(wordCount).toBeLessThanOrEqual(12);
      expect(response.length).toBeLessThan(100); // Character limit
    });

    test('should be motivational without being harsh', async () => {
      const response = await generateAIResponse('I failed my workout today', testUserId, 'taskmaster');
      
      // Should be tough but not cruel
      expect(response).not.toMatch(/stupid|idiot|worthless|pathetic/i);
      expect(response).toMatch(/go|do|work|push|move|start|begin|execute/i);
    });
  });

  describe('scenario-specific responses', () => {
    test('should handle motivation requests with urgency', async () => {
      const response = await generateAIResponse('I need motivation', testUserId, 'taskmaster');
      const evaluation = await evaluateTaskmasterResponse(response, 'motivation');
      
      expect(evaluation.motivationLevel).toBeGreaterThan(0.8);
      expect(response).toMatch(/go|do|work|push|move|start|begin|execute/i);
    });

    test('should handle setbacks with resilience focus', async () => {
      const response = await generateAIResponse('I failed my workout', testUserId, 'taskmaster');
      
      expect(response).toMatch(/get|back|up|again|next|time/i);
      expect(response).not.toMatch(/give|up|quit|stop/i);
    });

    test('should handle success with continued push', async () => {
      const response = await generateAIResponse('I achieved my goal', testUserId, 'taskmaster');
      
      expect(response).toMatch(/next|more|harder|push|further/i);
      expect(response).not.toMatch(/stop|rest|done|finished/i);
    });

    test('should handle laziness with direct challenge', async () => {
      const response = await generateAIResponse('I am feeling lazy', testUserId, 'taskmaster');
      
      expect(response).toMatch(/no|excuses|lazy|get|up|move/i);
      expect(response).toMatch(/💪|🔥|⚡/);
    });
  });

  describe('personality differentiation', () => {
    test('should be distinct from cheerleader personality', async () => {
      const taskmasterResponse = await generateAIResponse('I need motivation', testUserId, 'taskmaster');
      const cheerleaderResponse = await generateAIResponse('I need motivation', testUserId, 'cheerleader');
      
      // Should be different responses
      expect(taskmasterResponse).not.toBe(cheerleaderResponse);
      
      // Taskmaster should be more direct/action-oriented
      const taskmasterEval = await evaluateTaskmasterResponse(taskmasterResponse, 'motivation');
      expect(taskmasterEval.actionOrientation).toBeGreaterThan(0.7);
      
      // Taskmaster should use different emojis
      expect(taskmasterResponse).toMatch(/💪|🔥|⚡/);
      expect(taskmasterResponse).not.toMatch(/✨|🎉|🌟/);
    });
  });

  describe('performance evaluation', () => {
    test('should generate responses within performance targets', async () => {
      const { duration } = await TEST_UTILS.measureTime(async () => {
        await generateAIResponse('I need motivation', testUserId, 'taskmaster');
      });
      
      expect(duration).toBeLessThan(TEST_CONFIG.performanceTargets.responseTime);
    });

    test('should maintain consistency across multiple generations', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await generateAIResponse('I need motivation', testUserId, 'taskmaster');
        responses.push(response);
      }
      
      // All responses should meet quality criteria
      for (const response of responses) {
        const evaluation = await evaluateTaskmasterResponse(response, 'motivation');
        expect(evaluation.toneScore).toBeGreaterThan(0.7);
        expect(evaluation.wordCount).toBeLessThanOrEqual(12);
      }
    });
  });
}); 