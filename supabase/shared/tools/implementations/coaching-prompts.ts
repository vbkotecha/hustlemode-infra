// Coaching Prompts - Extracted from goal-coaching.ts
export class CoachingPrompts {
  static buildExpertCoachingPrompt(
    message: string,
    domain: string,
    depth_level: string,
    coaching_type: string,
    follow_up_context: string,
    specificity_needed: string,
    conversation_progression: string,
    unresolved_needs: string[],
    userGoals: any
  ): string {
    const domainExpertise = this.getDomainKnowledge(domain);
    const coachingSpecialist = this.getCoachingSpecialist(coaching_type);
    const depthGuidance = this.getDepthLevelGuidance(depth_level);
    const implementation = this.getImplementationStrategy(coaching_type, depth_level);
    const wordCount = this.getWordCountGuidance(depth_level);

    return `You are ${coachingSpecialist.title} specializing in ${domain}.

EXPERTISE: ${domainExpertise.expertise}
APPROACH: ${coachingSpecialist.approach}
FRAMEWORK: ${coachingSpecialist.framework}
FOCUS: ${domainExpertise.focus}

User Message: "${message}"
Goals Context: ${JSON.stringify(userGoals)}
Depth Required: ${depth_level} - ${depthGuidance}
Implementation: ${implementation}
Unresolved Needs: ${unresolved_needs.join(', ') || 'None'}

${wordCount}

Response must be exactly 8-12 words: actionable, domain-specific coaching that addresses their specific needs.`;
  }

  static getDomainKnowledge(domain: string): { expertise: string; focus: string } {
    const domains = {
      fitness: {
        expertise: 'Exercise physiology, training periodization, nutrition science, biomechanics',
        focus: 'Progressive overload, recovery optimization, sustainable habit formation'
      },
      learning: {
        expertise: 'Cognitive science, learning theory, memory consolidation, skill acquisition',
        focus: 'Spaced repetition, active recall, deliberate practice, knowledge transfer'
      },
      productivity: {
        expertise: 'Time management, attention management, cognitive load theory, workflow optimization',
        focus: 'Deep work principles, system thinking, habit stacking, energy management'
      },
      financial: {
        expertise: 'Behavioral economics, investment principles, risk management, wealth building',
        focus: 'Compound growth, emergency preparedness, diversification, long-term thinking'
      },
      creative: {
        expertise: 'Creative process, artistic development, innovation methodology, expression techniques',
        focus: 'Consistent practice, creative blocks, skill development, authentic expression'
      },
      health: {
        expertise: 'Preventive medicine, lifestyle factors, stress management, longevity research',
        focus: 'Sustainable habits, stress reduction, sleep optimization, holistic wellness'
      },
      general: {
        expertise: 'Goal setting, habit formation, motivation psychology, behavioral change',
        focus: 'Consistent action, obstacle navigation, progress measurement, resilience building'
      }
    };

    return domains[domain as keyof typeof domains] || domains.general;
  }

  static getCoachingSpecialist(coaching_type: string): { title: string; approach: string; framework: string } {
    const specialists = {
      strategic: {
        title: 'Strategic Planning Expert',
        approach: 'Systems thinking with long-term vision and milestone planning',
        framework: 'SMART goals → Implementation planning → Progress tracking → Optimization cycles'
      },
      tactical: {
        title: 'Implementation Specialist',
        approach: 'Step-by-step action planning with specific methodologies',
        framework: 'Break down → Sequence → Execute → Measure → Adjust'
      },
      troubleshooting: {
        title: 'Problem-Solving Coach',
        approach: 'Root cause analysis with solution-focused interventions',
        framework: 'Identify blockers → Analyze patterns → Generate solutions → Test → Scale'
      },
      motivational: {
        title: 'Accountability Coach',
        approach: 'Psychological motivation with behavioral reinforcement',
        framework: 'Connect to why → Build momentum → Celebrate wins → Push through resistance'
      },
      informational: {
        title: 'Knowledge Transfer Specialist',
        approach: 'Evidence-based information delivery with practical application',
        framework: 'Assess needs → Provide context → Explain application → Verify understanding'
      }
    };

    return specialists[coaching_type as keyof typeof specialists] || specialists.motivational;
  }

  static getDepthLevelGuidance(depth_level: string): string {
    const guidance = {
      surface: 'Basic overview, general principles, simple next steps',
      detailed: 'Specific methods, clear explanations, actionable details',
      implementation: 'Step-by-step instructions, exact processes, timing',
      strategic: 'Long-term planning, system design, optimization strategies', 
      expert: 'Advanced techniques, nuanced approaches, mastery principles'
    };

    return guidance[depth_level as keyof typeof guidance] || guidance.surface;
  }

  static getImplementationStrategy(coaching_type: string, depth_level: string): string {
    const strategies = {
      strategic: {
        surface: 'High-level strategy with key priorities',
        detailed: 'Strategic framework with specific milestones',
        implementation: 'Strategic implementation with detailed roadmap',
        expert: 'Advanced strategic optimization with predictive planning'
      },
      tactical: {
        surface: 'Key actions and immediate next steps',
        detailed: 'Specific tactics with clear methodologies',
        implementation: 'Complete tactical execution plan',
        expert: 'Advanced tactical optimization with efficiency gains'
      },
      troubleshooting: {
        surface: 'Problem identification with basic solutions',
        detailed: 'Root cause analysis with specific fixes',
        implementation: 'Complete problem resolution with prevention',
        expert: 'Systems-level troubleshooting with optimization'
      }
    };

    const typeStrategies = strategies[coaching_type as keyof typeof strategies];
    return typeStrategies ? typeStrategies[depth_level as keyof typeof typeStrategies] : 'Practical guidance with clear next steps';
  }

  static getWordCountGuidance(depth_level: string): string {
    const guidance = {
      surface: 'Keep response to exactly 8-12 words: simple and direct',
      detailed: 'Exactly 8-12 words: specific but concise guidance',
      implementation: 'Exactly 8-12 words: actionable steps, specific numbers',
      strategic: 'Exactly 8-12 words: strategic direction with clear priority',
      expert: 'Exactly 8-12 words: advanced insight, maximum impact'
    };

    return guidance[depth_level as keyof typeof guidance] || guidance.surface;
  }
} 