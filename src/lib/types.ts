export type TestScript = {
  id: string;
  title: string;
  description: string;
  created_at: string;
};

export type TestScriptStep = {
  id: string;
  script_id: string;
  section: string;
  instruction: string;
  media_url?: string;
  notes?: string;
  order_index: number;
};

export type TestExecution = {
  id: string;
  script_id: string;
  tester_email: string;
  rating?: number;
  feedback?: string;
  status: 'in_progress' | 'completed';
  created_at: string;
};

export type TestExecutionStep = {
  id: string;
  execution_id: string;
  step_id: string;
  status: 'not_started' | 'pass' | 'fail';
  comments?: string;
  uploaded_media_url?: string;
};
