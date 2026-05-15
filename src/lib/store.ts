import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from './types';

// In-memory mock store
class MockStore {
  scripts: TestScript[] = [
    {
      id: 'mock-script-1',
      title: 'UAT Accrual Manager',
      description: 'End-to-end testing for Gappify Accrual Cloud',
      created_at: new Date().toISOString(),
    }
  ];
  
  steps: TestScriptStep[] = [
    {
      id: 'step-1',
      script_id: 'mock-script-1',
      section: 'Accrual Manager Filters',
      instruction: 'Create a new test filter for your department.',
      notes: 'Ensure that the filter appears in the dropdown.',
      order_index: 0,
    },
    {
      id: 'step-2',
      script_id: 'mock-script-1',
      section: 'Accrual Manager Values',
      instruction: 'Activate monthly confirms by choosing "Unbilled".',
      notes: 'Verify the COA values.',
      order_index: 1,
    }
  ];

  executions: TestExecution[] = [];
  executionSteps: TestExecutionStep[] = [];

  getScripts() {
    return Promise.resolve(this.scripts);
  }

  getScript(id: string) {
    return Promise.resolve(this.scripts.find(s => s.id === id) || null);
  }

  getScriptSteps(scriptId: string) {
    return Promise.resolve(this.steps.filter(s => s.script_id === scriptId).sort((a, b) => a.order_index - b.order_index));
  }

  createScript(script: Omit<TestScript, 'id' | 'created_at'>) {
    const newScript: TestScript = {
      ...script,
      id: `script-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.scripts.push(newScript);
    return Promise.resolve(newScript);
  }

  updateScriptStep(id: string, updates: Partial<TestScriptStep>) {
    const idx = this.steps.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.steps[idx] = { ...this.steps[idx], ...updates };
      return Promise.resolve(this.steps[idx]);
    }
    return Promise.reject('Step not found');
  }

  createScriptStep(step: Omit<TestScriptStep, 'id'>) {
    const newStep: TestScriptStep = {
      ...step,
      id: `step-${Date.now()}`
    };
    this.steps.push(newStep);
    return Promise.resolve(newStep);
  }

  deleteScriptStep(id: string) {
    this.steps = this.steps.filter(s => s.id !== id);
    return Promise.resolve();
  }

  createExecution(execution: Omit<TestExecution, 'id' | 'created_at'>) {
    const newExecution: TestExecution = {
      ...execution,
      id: `exec-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    this.executions.push(newExecution);
    return Promise.resolve(newExecution);
  }

  updateExecutionStep(executionId: string, stepId: string, updates: Partial<TestExecutionStep>) {
    let execStep = this.executionSteps.find(es => es.execution_id === executionId && es.step_id === stepId);
    if (!execStep) {
      execStep = {
        id: `exec-step-${Date.now()}`,
        execution_id: executionId,
        step_id: stepId,
        status: 'not_started',
        ...updates
      };
      this.executionSteps.push(execStep);
    } else {
      Object.assign(execStep, updates);
    }
    return Promise.resolve(execStep);
  }

  getExecutionSteps(executionId: string) {
    return Promise.resolve(this.executionSteps.filter(es => es.execution_id === executionId));
  }

  updateExecution(id: string, updates: Partial<TestExecution>) {
    const idx = this.executions.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.executions[idx] = { ...this.executions[idx], ...updates };
      return Promise.resolve(this.executions[idx]);
    }
    return Promise.reject('Not found');
  }
}

export const mockStore = new MockStore();
