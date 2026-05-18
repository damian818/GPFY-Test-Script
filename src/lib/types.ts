export type TestScript = {
  id: string;
  title: string;
  description: string;
  category?: string;
  assignee_emails?: string[];
  tenant_domain?: string;
  creator_email?: string;
  order_index?: number;
  created_at: string;
};

export type TestScriptStep = {
  id: string;
  script_id: string;
  section: string;
  instruction: string;
  media_url?: string;
  notes?: string;
  test_data?: string;
  linked_step_id?: string;
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
  completed_at?: string;
  total_steps?: number;
  passed_steps?: number;
  failed_steps?: number;
};

export type TestExecutionStep = {
  id: string;
  execution_id: string;
  step_id: string;
  status: 'not_started' | 'pass' | 'fail';
  comments?: string;
  uploaded_media_url?: string;
};

export type SupportNotification = {
  id: string;
  tester_email: string;
  type: 'HELP_REQUESTED' | 'SCRIPT_FAILURE' | 'GENERAL_FEEDBACK';
  details: any;
  status: 'pending' | 'resolved';
  created_at: string;
};
