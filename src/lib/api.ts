import { supabase } from './supabase.ts';
import { mockStore } from './store.ts';
import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from './types.ts';

export const api = {
  async getScripts(): Promise<TestScript[]> {
    if (!supabase) return mockStore.getScripts();
    const { data, error } = await supabase.from('test_scripts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getScript(id: string): Promise<TestScript | null> {
    if (!supabase) return mockStore.getScript(id);
    const { data, error } = await supabase.from('test_scripts').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async createScript(script: Omit<TestScript, 'id' | 'created_at'>): Promise<TestScript> {
    if (!supabase) return mockStore.createScript(script);
    const { data, error } = await supabase.from('test_scripts').insert(script).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateScript(id: string, updates: Partial<TestScript>): Promise<TestScript> {
    if (!supabase) return mockStore.updateScript(id, updates);
    const { data, error } = await supabase.from('test_scripts').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getScriptSteps(scriptId: string): Promise<TestScriptStep[]> {
    if (!supabase) return mockStore.getScriptSteps(scriptId);
    const { data, error } = await supabase.from('test_script_steps').select('*').eq('script_id', scriptId).order('order_index');
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateScriptStep(id: string, updates: Partial<TestScriptStep>): Promise<TestScriptStep> {
    if (!supabase) return mockStore.updateScriptStep(id, updates);
    const { data, error } = await supabase.from('test_script_steps').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async createScriptStep(step: Omit<TestScriptStep, 'id'>): Promise<TestScriptStep> {
    if (!supabase) return mockStore.createScriptStep(step);
    const { data, error } = await supabase.from('test_script_steps').insert(step).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteScriptStep(id: string): Promise<void> {
    if (!supabase) return mockStore.deleteScriptStep(id);
    const { error } = await supabase.from('test_script_steps').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async createExecution(execution: Omit<TestExecution, 'id' | 'created_at'>): Promise<TestExecution> {
    if (!supabase) return mockStore.createExecution(execution);
    const { data, error } = await supabase.from('test_executions').insert(execution).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getExecutions(): Promise<TestExecution[]> {
    if (!supabase) return mockStore.getExecutions();
    const { data, error } = await supabase.from('test_executions')
      .select('*, test_scripts(title)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getExecution(id: string): Promise<TestExecution | null> {
    if (!supabase) return mockStore.getExecution(id);
    const { data, error } = await supabase.from('test_executions')
      .select('*, test_scripts(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async getExecutionSteps(executionId: string): Promise<TestExecutionStep[]> {
    if (!supabase) return mockStore.getExecutionSteps(executionId);
    const { data, error } = await supabase.from('test_execution_steps')
      .select('*')
      .eq('execution_id', executionId);
    if (error) throw new Error(error.message);
    return data || [];
  },

  async updateExecutionStep(executionId: string, stepId: string, updates: Partial<TestExecutionStep>): Promise<TestExecutionStep> {
    if (!supabase) return mockStore.updateExecutionStep(executionId, stepId, updates);
    const { data, error } = await supabase.from('test_execution_steps')
      .upsert({ execution_id: executionId, step_id: stepId, ...updates }, { onConflict: 'execution_id,step_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateExecution(id: string, updates: Partial<TestExecution>): Promise<TestExecution> {
    if (!supabase) return mockStore.updateExecution(id, updates);
    const { data, error } = await supabase.from('test_executions').update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async uploadMedia(file: File): Promise<string> {
    if (!supabase) {
      return URL.createObjectURL(file);
    }
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const { data, error } = await supabase.storage.from('media').upload(filename, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filename);
    return publicUrl;
  }
};
