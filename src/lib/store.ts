import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from '@/lib/types';

// In-memory mock store
class MockStore {
  scripts: TestScript[] = [
    {
      id: 'mock-script-user',
      title: 'User UAT Test Script',
      description: 'Standard end-user testing for Gappify Accrual Cloud workflows.',
      category: 'User Training',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-script-admin',
      title: 'Admin Test Script',
      description: 'System administration, security, and period close controls testing.',
      category: 'Admin Controls',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-script-supp',
      title: 'Supplemental Test Script',
      description: 'Additional testing scenarios for data access and bulk imports.',
      category: 'Security',
      created_at: new Date().toISOString(),
    }
  ];
  
  steps: TestScriptStep[] = [
    // USER SCRIPT STEPS
    {
      id: 'u-1',
      script_id: 'mock-script-user',
      section: 'Accrual Manager',
      instruction: 'Navigate to Accrual Manager and confirm Vendors/POs were completely ingested from your ERP.',
      notes: 'Check integration criteria with GPFY project team.',
      order_index: 0,
    },
    {
      id: 'u-2',
      script_id: 'mock-script-user',
      section: 'Accrual Manager Filters',
      instruction: 'Create a new test filter for your department or a specific GL account.',
      notes: 'Test saving and applying these filters.',
      order_index: 1,
    },
    {
      id: 'u-3',
      script_id: 'mock-script-user',
      section: 'Complete Confirms',
      instruction: 'Review Vendor Confirm emails and complete the Accrual Form via the provided link.',
      notes: 'Take a screenshot of input values before submitting.',
      order_index: 2,
    },
    {
      id: 'u-4',
      script_id: 'mock-script-user',
      section: 'Review Center',
      instruction: 'Familiarize yourself with the three-section layout: Historical, Month-to-Date, and Gappify Accruals.',
      notes: 'Test drilling down into accrual details.',
      order_index: 3,
    },

    // ADMIN SCRIPT STEPS
    {
      id: 'a-1',
      script_id: 'mock-script-admin',
      section: 'User Management',
      instruction: 'Create a new test user and verify that an email notification is sent.',
      notes: 'Test the user activation process.',
      order_index: 0,
    },
    {
      id: 'a-2',
      script_id: 'mock-script-admin',
      section: 'Period Close Controls',
      instruction: 'Close a fiscal period in Period Manager and verify that the lock icon appears.',
      notes: 'Test opening and closing workflows.',
      order_index: 1,
    },
    {
      id: 'a-3',
      script_id: 'mock-script-admin',
      section: 'Issue Handling',
      instruction: 'Configure multiple accrual flow launches and check for schedule conflicts.',
      notes: 'Ensure at least a 15-minute interval between launches.',
      order_index: 2,
    },

    // SUPPLEMENTAL STEPS
    {
      id: 's-1',
      script_id: 'mock-script-supp',
      section: 'Data Access Controls',
      instruction: 'Restrict a user to specific Departments and verify they cannot see data from other areas.',
      notes: 'Test with "Full Access" unchecked.',
      order_index: 0,
    },
    {
      id: 's-2',
      script_id: 'mock-script-supp',
      section: 'Import/Export',
      instruction: 'Export Accrual Rules to CSV, modify a field, and import it back to verify the update.',
      notes: 'Check email notifications for the import summary.',
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

  updateScript(id: string, updates: Partial<TestScript>) {
    const idx = this.scripts.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.scripts[idx] = { ...this.scripts[idx], ...updates };
      return Promise.resolve(this.scripts[idx]);
    }
    return Promise.reject('Script not found');
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

  getExecutions() {
    return Promise.resolve(this.executions.map(e => ({
      ...e,
      test_scripts: this.scripts.find(s => s.id === e.script_id)
    })));
  }

  getExecution(id: string) {
    const exe = this.executions.find(e => e.id === id);
    if (exe) {
      return Promise.resolve({
        ...exe,
        test_scripts: this.scripts.find(s => s.id === exe.script_id)
      });
    }
    return Promise.resolve(null);
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
