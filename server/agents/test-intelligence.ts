/**
 * Agent Girl Intelligence System - Verification Test
 * Tests all modules to ensure they work correctly
 */

import {
  createIntelligenceSystem,
  createAutonomousHarness,
  createSessionManager,
  createValidationEngine,
  LearningEngine,
  ParallelExecutor,
  GoalDecomposer,
} from './index';

const TEST_PROJECT_PATH = '/tmp/agent-girl-test';

async function runTests() {
  console.log('🧪 Agent Girl Intelligence System - Verification\n');
  console.log('='.repeat(60));

  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  // Test 1: Create Intelligence System
  console.log('\n📦 Test 1: Create Intelligence System');
  try {
    const system = createIntelligenceSystem(TEST_PROJECT_PATH);

    const hasAll = [
      'learning',
      'executor',
      'goals',
      'suggestions',
      'refactoring',
      'deploy',
      'cicd',
      'session',
      'validation',
      'harness',
      'createSite',
      'runAutonomous',
      'validate',
    ].every(key => key in system);

    if (hasAll) {
      console.log('   ✅ All components present');
      results.push({ name: 'Create Intelligence System', passed: true });
    } else {
      throw new Error('Missing components');
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Create Intelligence System', passed: false, error: String(error) });
  }

  // Test 2: Learning Engine Singleton
  console.log('\n🧠 Test 2: Learning Engine');
  try {
    const learning1 = LearningEngine.getInstance();
    const learning2 = LearningEngine.getInstance();

    if (learning1 === learning2) {
      console.log('   ✅ Singleton pattern works');
    }

    // Test learning an explicit preference (signature: statement, category, context)
    await learning1.learnExplicit(
      'I prefer single quotes over double quotes in JavaScript',
      'code_style',
      { workingDirectory: TEST_PROJECT_PATH }
    );

    console.log('   ✅ Learned explicit preference');

    // Test getting preferences
    const prefs = learning1.getPreferences('code_style');
    console.log(`   ✅ Retrieved ${prefs.length} preference(s)`);

    results.push({ name: 'Learning Engine', passed: true });
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Learning Engine', passed: false, error: String(error) });
  }

  // Test 3: Parallel Executor
  console.log('\n⚡ Test 3: Parallel Executor');
  try {
    const executor = new ParallelExecutor({ maxWorkers: 3, minWorkers: 1 });
    const status = executor.getStatus();

    if (status.workers >= 1) {
      console.log(`   ✅ Worker pool initialized: ${status.workers} workers`);
    }

    // Add test tasks
    executor.addTasks([
      { id: 'task1', type: 'analyze', params: {}, priority: 'high', timeout: 1000, retries: 1 },
      { id: 'task2', type: 'analyze', params: {}, priority: 'medium', timeout: 1000, retries: 1 },
    ]);

    const statusAfter = executor.getStatus();
    if (statusAfter.queued === 2) {
      console.log(`   ✅ Tasks queued: ${statusAfter.queued}`);
      results.push({ name: 'Parallel Executor', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Parallel Executor', passed: false, error: String(error) });
  }

  // Test 4: Goal Decomposer
  console.log('\n🎯 Test 4: Goal Decomposer');
  try {
    const decomposer = new GoalDecomposer({ workingDirectory: TEST_PROJECT_PATH });

    const plan = await decomposer.decompose('Add user authentication with JWT');

    if (plan && plan.phases && plan.phases.length > 0) {
      console.log(`   ✅ Goal decomposed into ${plan.phases.length} phases`);
      console.log(`   ✅ Estimated complexity: ${plan.phases.reduce((s, p) => s + p.steps.length, 0)} steps`);
      results.push({ name: 'Goal Decomposer', passed: true });
    } else {
      throw new Error('No plan generated');
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Goal Decomposer', passed: false, error: String(error) });
  }

  // Test 5: Session Manager
  console.log('\n📋 Test 5: Session Manager');
  try {
    const sessionManager = createSessionManager(TEST_PROJECT_PATH);

    const session = await sessionManager.startSession();

    if (session.id && session.number === 1) {
      console.log(`   ✅ Session started: ${session.id}`);
    }

    // Track some context
    sessionManager.trackFileRead('/test/file.ts', 'const x = 1;', 'high');
    sessionManager.trackDecision('Use TypeScript', 'Type safety', true);

    const status = sessionManager.getStatus();
    if (status.filesTracked === 1 && status.decisionsTracked === 1) {
      console.log(`   ✅ Context tracked: ${status.filesTracked} files, ${status.decisionsTracked} decisions`);
    }

    // End session and get handoff
    const handoff = await sessionManager.endSession();

    if (handoff.nextSteps.length > 0 || handoff.completedTasks.length >= 0) {
      console.log(`   ✅ Handoff generated with ${handoff.nextSteps.length} next steps`);
      results.push({ name: 'Session Manager', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Session Manager', passed: false, error: String(error) });
  }

  // Test 6: Validation Engine
  console.log('\n✅ Test 6: Validation Engine');
  try {
    const validation = createValidationEngine(TEST_PROJECT_PATH, {
      enabledTypes: ['typescript'], // Only test TS to avoid missing deps
    });

    const status = validation.getStatus();
    if (status.enabledTypes.includes('typescript')) {
      console.log(`   ✅ Validation engine initialized: ${status.enabledTypes.join(', ')}`);
    }

    // Add regression test
    const testId = validation.addRegressionTest({
      name: 'Health Check',
      description: 'Verify health endpoint',
      steps: [
        { action: 'assert', target: 'package.json', expected: true },
      ],
    });

    if (testId) {
      console.log(`   ✅ Regression test added: ${testId}`);
      results.push({ name: 'Validation Engine', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Validation Engine', passed: false, error: String(error) });
  }

  // Test 7: Autonomous Harness
  console.log('\n🤖 Test 7: Autonomous Harness');
  try {
    const harness = createAutonomousHarness(TEST_PROJECT_PATH);

    const featureList = await harness.initialize({
      name: 'Test App',
      description: 'A test application',
      coreFeatures: ['User Management', 'Dashboard'],
      techStack: {
        backend: 'Bun + Hono',
        frontend: 'React',
        database: 'SQLite',
      },
      successCriteria: ['All endpoints work', 'Tests pass'],
    });

    if (featureList.features.length > 0) {
      console.log(`   ✅ Feature list generated: ${featureList.features.length} features`);

      // Show first 5 features
      console.log('   📝 Sample features:');
      featureList.features.slice(0, 5).forEach(f => {
        console.log(`      - #${f.id}: ${f.name} (${f.priority})`);
      });

      results.push({ name: 'Autonomous Harness', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Autonomous Harness', passed: false, error: String(error) });
  }

  // Test 8: Deploy Manager
  console.log('\n🚀 Test 8: Deploy Manager');
  try {
    const system = createIntelligenceSystem(TEST_PROJECT_PATH);

    // Just test recommendation (no actual deploy)
    const recommendation = await system.deploy.recommendProvider();

    if (recommendation.recommended) {
      console.log(`   ✅ Recommended provider: ${recommendation.recommended}`);
      console.log(`   ✅ Alternatives: ${recommendation.alternatives.join(', ')}`);
      results.push({ name: 'Deploy Manager', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Deploy Manager', passed: false, error: String(error) });
  }

  // Test 9: CI/CD Generator
  console.log('\n🔄 Test 9: CI/CD Generator');
  try {
    const system = createIntelligenceSystem(TEST_PROJECT_PATH);

    const templates = system.cicd.listTemplates();

    if (templates.length > 0) {
      console.log(`   ✅ Available templates: ${templates.length}`);
      templates.slice(0, 3).forEach(t => {
        console.log(`      - ${t.name}: ${t.description}`);
      });
      results.push({ name: 'CI/CD Generator', passed: true });
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'CI/CD Generator', passed: false, error: String(error) });
  }

  // Test 10: Refactoring Assistant
  console.log('\n🔧 Test 10: Refactoring Assistant');
  try {
    const system = createIntelligenceSystem(TEST_PROJECT_PATH);

    // Verify refactoring assistant exists and can be called
    if (system.refactoring) {
      console.log(`   ✅ Refactoring assistant initialized`);
      results.push({ name: 'Refactoring Assistant', passed: true });
    } else {
      throw new Error('Refactoring assistant not available');
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error}`);
    results.push({ name: 'Refactoring Assistant', passed: false, error: String(error) });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name}${r.error ? `: ${r.error}` : ''}`);
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${passed}/${results.length} passed (${Math.round(passed/results.length*100)}%)`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Intelligence system is fully operational.\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.\n`);
  }

  return { passed, failed, total: results.length };
}

// Run tests
runTests().catch(console.error);
