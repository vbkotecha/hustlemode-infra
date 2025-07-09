// Test the exact message from the screenshot
const message = "Set goal: go for running every day";
const lowerMessage = message.toLowerCase();

console.log('🧪 Testing message:', message);
console.log('📝 Lowercase:', lowerMessage);

// Test goal detection
const goalKeywords = ['set goal', 'add goal', 'create goal', 'my goals', 'list goals', 'complete goal'];
const isGoalCommand = goalKeywords.some(keyword => lowerMessage.includes(keyword));

console.log('🎯 Goal keywords:', goalKeywords);
console.log('✅ Is goal command:', isGoalCommand);

if (isGoalCommand) {
  console.log('🔧 Should trigger tool execution');
  
  // Test title extraction
  const match = message.match(/(?:set|add|create)\s+goal[:\s]+(.+)/i);
  const title = match ? match[1].trim() : 'New Goal';
  console.log('📄 Extracted title:', title);
} else {
  console.log('❌ Should NOT trigger tool execution');
}
