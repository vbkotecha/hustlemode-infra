// Integration tests for Chat API
import { TEST_CONFIG, TEST_DATA, TEST_UTILS } from '../../config/test-env.ts';

const API_BASE_URL = 'https://yzfclhnkxpgyxeklrvur.supabase.co/functions/v1';

describe('Chat API Integration', () => {
  describe('POST /chat', () => {
    test('should handle complete goal-setting workflow', async () => {
      // 1. User requests goal setting
      const response1 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.goalSetting,
          personality: 'cheerleader'
        })
      });
      
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);
      expect(data1.data.tools_used).toBeGreaterThan(0);

      // 2. User reports progress
      const response2 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.progress,
          personality: 'cheerleader'
        })
      });
      
      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.data.response).toMatch(/awesome|great|amazing/i);
    });

    test('should handle personality switching', async () => {
      // 1. Start with taskmaster
      const response1 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.motivation,
          personality: 'taskmaster'
        })
      });
      
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // 2. Switch to cheerleader
      const response2 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.personalitySwitch,
          personality: 'taskmaster'
        })
      });
      
      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      expect(data2.data.response).toMatch(/amazing|awesome|great/i);
    });

    test('should maintain conversation context across messages', async () => {
      const userId = TEST_UTILS.generateTestUserId();
      const phoneNumber = TEST_UTILS.generateTestPhoneNumber();

      // 1. Set a goal
      const response1 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number,
          message: 'I want to read 20 books this year',
          personality: 'cheerleader'
        })
      });
      
      expect(response1.status).toBe(200);
      const data1 = await response1.json();
      expect(data1.success).toBe(true);

      // 2. Report progress (should reference the goal)
      const response2 = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number,
          message: 'I finished reading my first book',
          personality: 'cheerleader'
        })
      });
      
      expect(response2.status).toBe(200);
      const data2 = await response2.json();
      expect(data2.success).toBe(true);
      expect(data2.data.response).toMatch(/book|reading/i);
    });

    test('should handle simple motivation requests', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.motivation,
          personality: 'taskmaster'
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.response).toBeTruthy();
      expect(data.data.response.split(' ').length).toBeLessThanOrEqual(12);
    });
  });

  describe('performance', () => {
    test('should meet response time targets', async () => {
      const { duration } = await TEST_UTILS.measureTime(async () => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: TEST_CONFIG.testPhoneNumber,
            message: TEST_DATA.messages.motivation,
            personality: 'taskmaster'
          })
        });
        
        expect(response.status).toBe(200);
        await response.json();
      });

      expect(duration).toBeLessThan(TEST_CONFIG.performanceTargets.responseTime);
    });

    test('should handle concurrent requests', async () => {
      const concurrentRequests = TEST_CONFIG.performanceTargets.concurrentRequests;
      const promises = Array(concurrentRequests).fill(0).map(() => 
        fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: TEST_CONFIG.testPhoneNumber,
            message: TEST_DATA.messages.motivation,
            personality: 'taskmaster'
          })
        })
      );
      
      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('error handling', () => {
    test('should handle invalid phone numbers', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: 'invalid-phone',
          message: TEST_DATA.messages.motivation,
          personality: 'taskmaster'
        })
      });
      
      // Should handle gracefully (either 400 or 200 with error in response)
      expect([200, 400]).toContain(response.status);
    });

    test('should handle missing required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          // Missing message field
          personality: 'taskmaster'
        })
      });
      
      expect([400, 422]).toContain(response.status);
    });

    test('should handle invalid personality', async () => {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: TEST_CONFIG.testPhoneNumber,
          message: TEST_DATA.messages.motivation,
          personality: 'invalid-personality'
        })
      });
      
      // Should default to taskmaster or return error
      expect([200, 400]).toContain(response.status);
    });
  });
}); 