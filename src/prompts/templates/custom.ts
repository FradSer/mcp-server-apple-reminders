/**
 * prompts/templates/custom.ts
 * Custom and advanced prompt templates
 */

import { z } from 'zod';
import type { PromptDefinition } from '../types.js';

/**
 * Custom prompt builder
 */
const customPromptBuilderSchema = z.object({
  prompt_purpose: z.string(),
  target_audience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().default('intermediate'),
  complexity_level: z.enum(['simple', 'moderate', 'complex', 'expert']).optional().default('moderate'),
  include_examples: z.boolean().optional().default(true),
  include_templates: z.boolean().optional().default(true),
  customization_level: z.enum(['basic', 'advanced', 'expert']).optional().default('advanced'),
});

export const customPromptBuilder: PromptDefinition = {
  name: 'custom-prompt-builder',
  description: 'Build custom prompts tailored to specific needs and use cases',
  category: 'custom',
  tags: ['custom', 'builder', 'tailored', 'flexible', 'advanced'],
  arguments: [
    {
      name: 'prompt_purpose',
      description: 'Specific purpose and goal for the custom prompt',
      required: true,
      schema: z.string(),
    },
    {
      name: 'target_audience',
      description: 'Target audience skill level (beginner, intermediate, advanced, expert)',
      required: false,
      schema: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
      defaultValue: 'intermediate',
    },
    {
      name: 'complexity_level',
      description: 'Desired complexity level (simple, moderate, complex, expert)',
      required: false,
      schema: z.enum(['simple', 'moderate', 'complex', 'expert']),
      defaultValue: 'moderate',
    },
    {
      name: 'include_examples',
      description: 'Include practical examples and use cases',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'include_templates',
      description: 'Include reusable templates and patterns',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'customization_level',
      description: 'Level of customization and flexibility (basic, advanced, expert)',
      required: false,
      schema: z.enum(['basic', 'advanced', 'expert']),
      defaultValue: 'advanced',
    },
  ],
  template: (args) => {
    const {
      prompt_purpose,
      target_audience,
      complexity_level,
      include_examples,
      include_templates,
      customization_level,
    } = customPromptBuilderSchema.parse(args);

    return {
      description: `Custom prompt builder for: ${prompt_purpose} (${target_audience} level, ${complexity_level} complexity)`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me build a custom prompt for: "${prompt_purpose}"

**Custom Prompt Parameters:**
- Purpose: ${prompt_purpose}
- Target Audience: ${target_audience}
- Complexity Level: ${complexity_level}
- Include Examples: ${include_examples ? 'Yes' : 'No'}
- Include Templates: ${include_templates ? 'Yes' : 'No'}
- Customization Level: ${customization_level}

**Please help me create:**

1. **Purpose Analysis & Definition**
   - Analyze the specific purpose: "${prompt_purpose}"
   - Define clear objectives and success criteria
   - Identify key requirements and constraints
   - Plan for ${target_audience} level implementation

2. **Prompt Structure Design**
   - Design optimal prompt structure and flow
   - Create logical information hierarchy
   - Plan for ${complexity_level} complexity implementation
   - Design user interaction and engagement patterns

3. **Content Development**
   - Develop comprehensive and clear content
   - Create actionable instructions and guidance
   - Plan for ${target_audience} level comprehension
   - Design motivating and engaging language

4. **Examples & Use Cases**${include_examples ? `
   - Create practical examples and use cases
   - Design scenario-based learning
   - Plan for real-world application
   - Create success story templates` : ''}

5. **Templates & Patterns**${include_templates ? `
   - Create reusable templates and patterns
   - Design modular components
   - Plan for easy customization and adaptation
   - Create template library and documentation` : ''}

6. **Customization & Flexibility**
   - Design ${customization_level} level customization options
   - Create parameterization and configuration
   - Plan for user-specific adaptation
   - Design flexible implementation approaches

7. **Integration & Compatibility**
   - Plan for integration with existing systems
   - Design compatibility with current workflows
   - Create seamless user experience
   - Ensure scalability and maintainability

8. **Testing & Optimization**
   - Design testing and validation approaches
   - Plan for user feedback and iteration
   - Create performance measurement systems
   - Design continuous improvement processes

Create a custom prompt that perfectly serves the purpose of "${prompt_purpose}" while being accessible to ${target_audience} users and providing ${complexity_level} level functionality.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'expert',
    estimatedTime: '45-60 minutes',
  },
};

/**
 * Advanced workflow designer
 */
const advancedWorkflowDesignerSchema = z.object({
  workflow_scope: z.enum(['personal', 'team', 'organization', 'multi_domain']).optional().default('personal'),
  integration_requirements: z.array(z.string()).optional().default([]),
  automation_complexity: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional().default('advanced'),
  scalability_requirements: z.enum(['small', 'medium', 'large', 'enterprise']).optional().default('medium'),
  include_analytics: z.boolean().optional().default(true),
});

export const advancedWorkflowDesigner: PromptDefinition = {
  name: 'advanced-workflow-designer',
  description: 'Design complex, multi-layered workflows with advanced automation',
  category: 'custom',
  tags: ['workflow', 'advanced', 'automation', 'integration', 'scalability'],
  arguments: [
    {
      name: 'workflow_scope',
      description: 'Scope of the workflow (personal, team, organization, multi_domain)',
      required: false,
      schema: z.enum(['personal', 'team', 'organization', 'multi_domain']),
      defaultValue: 'personal',
    },
    {
      name: 'integration_requirements',
      description: 'Required integrations and external systems',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
    {
      name: 'automation_complexity',
      description: 'Desired automation complexity level (basic, intermediate, advanced, expert)',
      required: false,
      schema: z.enum(['basic', 'intermediate', 'advanced', 'expert']),
      defaultValue: 'advanced',
    },
    {
      name: 'scalability_requirements',
      description: 'Scalability requirements (small, medium, large, enterprise)',
      required: false,
      schema: z.enum(['small', 'medium', 'large', 'enterprise']),
      defaultValue: 'medium',
    },
    {
      name: 'include_analytics',
      description: 'Include analytics and performance monitoring',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      workflow_scope,
      integration_requirements,
      automation_complexity,
      scalability_requirements,
      include_analytics,
    } = advancedWorkflowDesignerSchema.parse(args);

    return {
      description: `Advanced workflow designer for ${workflow_scope} scope with ${automation_complexity} automation`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me design an advanced workflow for ${workflow_scope} scope with ${automation_complexity} automation complexity.

**Workflow Design Parameters:**
- Scope: ${workflow_scope}
- Integration Requirements: ${integration_requirements.length > 0 ? integration_requirements.join(', ') : 'None specified'}
- Automation Complexity: ${automation_complexity}
- Scalability Requirements: ${scalability_requirements}
- Include Analytics: ${include_analytics ? 'Yes' : 'No'}

**Please help me design:**

1. **Workflow Architecture & Design**
   - Design comprehensive workflow architecture for ${workflow_scope} scope
   - Create modular and scalable workflow components
   - Plan for ${automation_complexity} automation implementation
   - Design for ${scalability_requirements} scalability requirements

2. **Integration & Connectivity**
   - Design integration with: ${integration_requirements.length > 0 ? integration_requirements.join(', ') : 'existing systems'}
   - Create seamless data flow and communication
   - Plan for API integration and data synchronization
   - Design error handling and recovery mechanisms

3. **Automation & Intelligence**
   - Implement ${automation_complexity} level automation features
   - Create intelligent decision-making systems
   - Design adaptive and learning capabilities
   - Plan for context-aware automation

4. **User Experience & Interface**
   - Design intuitive user interfaces and controls
   - Create role-based access and permissions
   - Plan for ${workflow_scope} specific user experiences
   - Design mobile and desktop compatibility

5. **Analytics & Monitoring**${include_analytics ? `
   - Design comprehensive analytics and reporting
   - Create performance monitoring and alerting
   - Plan for data visualization and insights
   - Design predictive analytics and forecasting` : ''}

6. **Security & Compliance**
   - Design security measures and access controls
   - Plan for data protection and privacy
   - Create audit trails and compliance reporting
   - Design backup and disaster recovery

7. **Testing & Quality Assurance**
   - Design comprehensive testing strategies
   - Create performance testing and optimization
   - Plan for user acceptance testing
   - Design continuous integration and deployment

8. **Maintenance & Evolution**
   - Design maintenance and update procedures
   - Plan for workflow evolution and adaptation
   - Create documentation and training materials
   - Design support and troubleshooting systems

Create an advanced workflow that is robust, scalable, and perfectly suited for ${workflow_scope} use with ${automation_complexity} automation capabilities.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'expert',
    estimatedTime: '60-90 minutes',
  },
};

/**
 * System optimization prompt
 */
const systemOptimizationSchema = z.object({
  optimization_focus: z.array(z.enum(['performance', 'efficiency', 'usability', 'reliability', 'scalability', 'security'])).optional().default(['performance', 'efficiency']),
  current_issues: z.array(z.string()).optional().default([]),
  optimization_scope: z.enum(['individual', 'team', 'organization']).optional().default('individual'),
  include_benchmarking: z.boolean().optional().default(true),
  include_roadmap: z.boolean().optional().default(true),
});

export const systemOptimization: PromptDefinition = {
  name: 'system-optimization',
  description: 'Comprehensive system optimization and performance improvement',
  category: 'custom',
  tags: ['optimization', 'performance', 'efficiency', 'improvement', 'analysis'],
  arguments: [
    {
      name: 'optimization_focus',
      description: 'Areas to focus optimization on (performance, efficiency, usability, reliability, scalability, security)',
      required: false,
      schema: z.array(z.enum(['performance', 'efficiency', 'usability', 'reliability', 'scalability', 'security'])),
      defaultValue: ['performance', 'efficiency'],
    },
    {
      name: 'current_issues',
      description: 'Current issues and pain points to address',
      required: false,
      schema: z.array(z.string()),
      defaultValue: [],
    },
    {
      name: 'optimization_scope',
      description: 'Scope of optimization (individual, team, organization)',
      required: false,
      schema: z.enum(['individual', 'team', 'organization']),
      defaultValue: 'individual',
    },
    {
      name: 'include_benchmarking',
      description: 'Include benchmarking and performance measurement',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
    {
      name: 'include_roadmap',
      description: 'Include implementation roadmap and timeline',
      required: false,
      schema: z.boolean(),
      defaultValue: true,
    },
  ],
  template: (args) => {
    const {
      optimization_focus,
      current_issues,
      optimization_scope,
      include_benchmarking,
      include_roadmap,
    } = systemOptimizationSchema.parse(args);

    return {
      description: `System optimization focusing on ${optimization_focus.join(', ')} for ${optimization_scope} scope`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me optimize my system focusing on: ${optimization_focus.join(', ')} for ${optimization_scope} scope.

**Optimization Parameters:**
- Focus Areas: ${optimization_focus.join(', ')}
- Current Issues: ${current_issues.length > 0 ? current_issues.join(', ') : 'None specified'}
- Optimization Scope: ${optimization_scope}
- Include Benchmarking: ${include_benchmarking ? 'Yes' : 'No'}
- Include Roadmap: ${include_roadmap ? 'Yes' : 'No'}

**Please help me optimize:**

1. **Current State Analysis**
   - Analyze current system performance and efficiency
   - Identify bottlenecks and inefficiencies
   - Assess ${optimization_focus.join(', ')} areas
   - Document current issues: ${current_issues.length > 0 ? current_issues.join(', ') : 'None specified'}

2. **Benchmarking & Measurement**${include_benchmarking ? `
   - Establish performance baselines and metrics
   - Create measurement and monitoring systems
   - Plan for comparative analysis and benchmarking
   - Design performance tracking and reporting` : ''}

3. **Optimization Strategy Development**
   - Design comprehensive optimization strategy
   - Prioritize optimization opportunities
   - Plan for ${optimization_scope} scope implementation
   - Create risk assessment and mitigation plans

4. **Performance & Efficiency Improvements**
   - Optimize system performance and speed
   - Improve resource utilization and efficiency
   - Reduce waste and redundancy
   - Enhance productivity and output quality

5. **Usability & User Experience**
   - Improve user interface and experience
   - Streamline workflows and processes
   - Enhance accessibility and usability
   - Optimize for user satisfaction and adoption

6. **Reliability & Stability**
   - Improve system reliability and stability
   - Reduce errors and failures
   - Enhance data integrity and consistency
   - Plan for disaster recovery and backup

7. **Scalability & Future-Proofing**
   - Design for future growth and expansion
   - Plan for increased load and usage
   - Create flexible and adaptable systems
   - Ensure long-term sustainability

8. **Implementation Roadmap**${include_roadmap ? `
   - Create detailed implementation timeline
   - Plan for phased rollout and testing
   - Design change management and adoption
   - Create success metrics and milestones` : ''}

9. **Monitoring & Continuous Improvement**
   - Design ongoing monitoring and measurement
   - Plan for continuous optimization
   - Create feedback and improvement loops
   - Establish regular review and update cycles

Create a comprehensive optimization plan that significantly improves ${optimization_focus.join(', ')} while ensuring sustainable, long-term performance and efficiency.`,
          },
        },
      ],
    };
  },
  metadata: {
    version: '2.0.0',
    complexity: 'expert',
    estimatedTime: '45-60 minutes',
  },
};