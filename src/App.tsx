import * as React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router';
import { 
  Moon, 
  Sun, 
  Settings, 
  PlusCircle, 
  Play, 
  Settings2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  UploadCloud, 
  ChevronRight, 
  ChevronLeft, 
  Save,
  Plus,
  MoveUp,
  MoveDown,
  Trash2,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from '@/lib/types';

// UI Components (Inline for simplicity and to avoid import issues during "from scratch" phase)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// --- Dashboard View ---
function Dashboard() {
  const [scripts, setScripts] = useState<TestScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [activeTab, setActiveTab] = useState<'scripts' | 'history'>('scripts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scriptsData, executionsData] = await Promise.all([
        api.getScripts(),
        // We'll need a getExecutions api call
        supabase ? supabase.from('test_executions').select('*, test_scripts(title)').order('created_at', { ascending: false }) : { data: [] }
      ]);
      setScripts(scriptsData);
      setExecutions((executionsData as any).data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle) return;
    try {
      const script = await api.createScript({
        title: newTitle,
        description: newDesc
      });
      setIsDialogOpen(false);
      navigate(`/admin/scripts/${script.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gappify QA</h1>
          <p className="text-muted-foreground mt-1">Manage scripts and track UAT execution history.</p>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="flex bg-muted p-1 rounded-lg">
                <button 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'scripts' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'}`}
                    onClick={() => setActiveTab('scripts')}
                >
                    Scripts
                </button>
                <button 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-background shadow-sm' : 'hover:text-foreground/80'}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button />}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Script
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Test Script</DialogTitle>
                  <DialogDescription>
                    Define a new script for user acceptance testing.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Accrual Manager UAT" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Brief description of the goals..." 
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newTitle}>Create & Add Steps</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {activeTab === 'scripts' ? (
        <>
            {loading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => (
                    <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                ))}
                </div>
            ) : scripts.length === 0 ? (
                <div className="text-center py-20 border rounded-lg border-dashed bg-card/50">
                <h3 className="text-lg font-semibold">No scripts found</h3>
                <p className="text-muted-foreground mt-1 mb-4">Get started by creating your first interactive test script.</p>
                <Button onClick={() => setIsDialogOpen(true)}>Create Script</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {scripts.map(script => (
                    <Card key={script.id} className="flex flex-col hover:shadow-md transition-all border-l-4 border-l-primary/20">
                    <CardHeader pb-2>
                        <CardTitle>{script.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{script.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 text-xs text-muted-foreground pt-0">
                        Created: {new Date(script.created_at).toLocaleDateString()}
                    </CardContent>
                    <CardFooter className="gap-2 border-t pt-4">
                        <Button render={<Link to={`/admin/scripts/${script.id}`} />} variant="outline" size="sm" className="flex-1">
                            <Settings2 className="mr-2 h-3.5 w-3.5" />
                            Edit
                        </Button>
                        <Button render={<Link to={`/execute/${script.id}`} />} size="sm" className="flex-1">
                            <Play className="mr-2 h-3.5 w-3.5" />
                            Run
                        </Button>
                    </CardFooter>
                    </Card>
                ))}
                </div>
            )}
        </>
      ) : (
          <div className="space-y-4">
              {loading ? (
                  <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />)}
                  </div>
              ) : executions.length === 0 ? (
                  <div className="text-center py-20 border rounded-lg border-dashed bg-card/50">
                    <h3 className="text-lg font-semibold">No execution history</h3>
                    <p className="text-muted-foreground mt-1">Run your first test script to see history here.</p>
                  </div>
              ) : (
                  <Card>
                      <CardContent className="p-0">
                          <table className="w-full text-sm">
                              <thead>
                                  <tr className="border-b bg-muted/30">
                                      <th className="text-left py-3 px-4 font-semibold">Script</th>
                                      <th className="text-left py-3 px-4 font-semibold">Tester</th>
                                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                                      <th className="text-left py-3 px-4 font-semibold">Date</th>
                                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {executions.map(exe => (
                                      <tr key={exe.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                          <td className="py-3 px-4 font-medium">{(exe as any).test_scripts?.title || 'Unknown Script'}</td>
                                          <td className="py-3 px-4 text-muted-foreground">{exe.tester_email}</td>
                                          <td className="py-3 px-4">
                                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${exe.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                  {exe.status.replace('_', ' ')}
                                              </span>
                                          </td>
                                          <td className="py-3 px-4 text-muted-foreground">{new Date(exe.created_at).toLocaleString()}</td>
                                          <td className="py-3 px-4 text-right">
                                              <Button variant="ghost" size="sm" render={<Link to={`/execute/${exe.script_id}`} />} disabled={exe.status === 'completed'}>
                                                  {exe.status === 'completed' ? 'View' : 'Resume'}
                                              </Button>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </CardContent>
                  </Card>
              )}
          </div>
      )}
    </div>
  );
}

// --- Script Editor View ---
function ScriptEditor() {
  const { scriptId } = useParams();
  const [script, setScript] = useState<TestScript | null>(null);
  const [steps, setSteps] = useState<TestScriptStep[]>([]);
  const [loading, setLoading] = useState(true);

  const [newSection, setNewSection] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    if (scriptId) loadData();
  }, [scriptId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await api.getScript(scriptId!);
      const st = await api.getScriptSteps(scriptId!);
      setScript(s);
      setSteps(st);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddStep = async () => {
    if (!newInstruction) return;
    try {
      const step = await api.createScriptStep({
        script_id: scriptId!,
        section: newSection || 'General',
        instruction: newInstruction,
        notes: newNotes,
        order_index: steps.length
      });
      setSteps([...steps, step]);
      setNewInstruction('');
      setNewNotes('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteScriptStep(id);
      setSteps(steps.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const moveStep = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= steps.length) return;
    const newSteps = [...steps];
    const temp = newSteps[index];
    newSteps[index] = newSteps[index + direction];
    newSteps[index + direction] = temp;
    
    // Update order indices
    const updated = newSteps.map((s, i) => ({ ...s, order_index: i }));
    setSteps(updated);
    
    try {
      await api.updateScriptStep(updated[index].id, { order_index: index });
      await api.updateScriptStep(updated[index + direction].id, { order_index: index + direction });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading script data...</div>;
  if (!script) return <div className="p-10 text-center">Script not found.</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-10 px-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" render={<Link to="/" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{script.title}</h1>
          <p className="text-muted-foreground">Manage activities for this UAT script.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Steps ({steps.length})</h2>
        
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader className="py-4 bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                <CardDescription className="font-semibold text-primary">{step.section}</CardDescription>
                <CardTitle className="text-lg">Step {index + 1}</CardTitle>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => moveStep(index, -1)} disabled={index === 0}>
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1}>
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(step.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="py-4 space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Instruction</Label>
                <p className="text-base font-medium leading-relaxed">{step.instruction}</p>
              </div>
              {step.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Expected Result / Notes</Label>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg border">{step.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 bg-transparent">
          <CardHeader>
            <CardTitle>Add New Step</CardTitle>
            <CardDescription>Append a new activity to this test script.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Section / Module</Label>
              <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. Accrual Manager" />
            </div>
            <div className="space-y-2">
              <Label>Instruction *</Label>
              <Textarea 
                value={newInstruction} 
                onChange={e => setNewInstruction(e.target.value)} 
                placeholder="Describe what the user should do..." 
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Guidance / Expected Result</Label>
              <Textarea 
                value={newNotes} 
                onChange={e => setNewNotes(e.target.value)} 
                placeholder="What should the user see or verify?" 
                rows={2}
              />
            </div>
            <Button onClick={handleAddStep} disabled={!newInstruction} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Step
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Execution View ---
function ExecutionView() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  const [script, setScript] = useState<TestScript | null>(null);
  const [steps, setSteps] = useState<TestScriptStep[]>([]);
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Current step state
  const [status, setStatus] = useState<'pass' | 'fail' | null>(null);
  const [comments, setComments] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (scriptId) startExecution();
  }, [scriptId]);

  const startExecution = async () => {
    setLoading(true);
    try {
      const s = await api.getScript(scriptId!);
      const st = await api.getScriptSteps(scriptId!);
      const exe = await api.createExecution({
        script_id: scriptId!,
        status: 'in_progress',
        tester_email: 'damian@gappify.com' // Default for now
      });
      setScript(s);
      setSteps(st);
      setExecution(exe);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await api.uploadMedia(file);
      setMediaUrl(url);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const saveCurrentStep = async () => {
    if (!execution || !status) return;
    try {
      await api.updateExecutionStep(execution.id, steps[currentStepIndex].id, {
        status,
        comments,
        uploaded_media_url: mediaUrl || undefined
      });

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setStatus(null);
        setComments('');
        setMediaUrl(null);
      } else {
        // All steps completed
        await api.updateExecution(execution.id, { status: 'completed' });
        navigate('/');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-10 text-center">Initializing test session...</div>;
  if (!script || steps.length === 0) return <div className="p-10 text-center">Cannot start execution.</div>;

  const currentStep = steps[currentStepIndex];

  return (
    <div className="flex-1 flex flex-col items-center bg-muted/20 pb-10">
      <div className="w-full bg-card border-b py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" render={<Link to="/" />}>
                <XCircle className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="font-bold">{script.title}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Running Execution</p>
            </div>
        </div>
        <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
                <div className="text-xs text-muted-foreground font-medium">Session Progress</div>
                <div className="text-sm font-bold">{currentStepIndex + 1} / {steps.length}</div>
            </div>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
      </div>

      <div className="w-full max-w-3xl mt-8 px-6 space-y-6">
        <Card className="shadow-lg border-primary/20 ring-1 ring-primary/5">
            <CardHeader className="bg-primary/5">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">{currentStep.section}</span>
                    <span className="text-xs font-medium text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</span>
                </div>
                <CardTitle className="text-xl leading-tight">{currentStep.instruction}</CardTitle>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
                {currentStep.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 p-4 rounded-lg">
                        <Label className="text-yellow-800 dark:text-yellow-500 text-xs font-bold uppercase tracking-wider mb-2 block">Expected Outcome</Label>
                        <p className="text-yellow-900 dark:text-yellow-400 font-medium">{currentStep.notes}</p>
                    </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                    <Label className="text-lg font-semibold">Step Status</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            variant={status === 'pass' ? 'default' : 'outline'}
                            className={`h-24 flex-col gap-2 ${status === 'pass' ? 'bg-green-600 hover:bg-green-700' : 'hover:border-green-500/50 hover:bg-green-50/50'}`}
                            onClick={() => setStatus('pass')}
                        >
                            <CheckCircle2 className={`h-8 w-8 ${status === 'pass' ? 'text-white' : 'text-green-500'}`} />
                            <span className="font-bold">PASSED</span>
                        </Button>
                        <Button 
                            variant={status === 'fail' ? 'destructive' : 'outline'}
                            className={`h-24 flex-col gap-2 ${status === 'fail' ? '' : 'hover:border-destructive/50 hover:bg-destructive/5'}`}
                            onClick={() => setStatus('fail')}
                        >
                            <XCircle className={`h-8 w-8 ${status === 'fail' ? 'text-white' : 'text-destructive'}`} />
                            <span className="font-bold">FAILED</span>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Evidence & Comments</Label>
                    <div className="space-y-4">
                        <div className="relative">
                            <Textarea 
                                placeholder="Add any observations or reason for failure..."
                                value={comments}
                                onChange={e => setComments(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1">
                                <Button 
                                    variant="outline" 
                                    className="w-full h-32 flex-col gap-2 border-dashed border-2 relative"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <span>Uploading...</span>
                                    ) : mediaUrl ? (
                                        <div className="flex flex-col items-center">
                                            <Check className="h-8 w-8 text-green-500 mb-1" />
                                            <span className="text-xs font-bold text-green-600">EVIDENCE ATTACHED</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-1">{mediaUrl}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                            <div className="text-center">
                                                <div className="font-bold text-sm">Upload Evidence</div>
                                                <div className="text-[10px] text-muted-foreground">Screenshots or Videos</div>
                                            </div>
                                        </>
                                    )}
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleMediaUpload}
                                        accept="image/*,video/*"
                                    />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6">
                <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={saveCurrentStep} 
                    disabled={!status}
                >
                    {currentStepIndex < steps.length - 1 ? 'Save & Next Step' : 'Complete Execution'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <header className="border-b px-6 py-4 flex items-center justify-between bg-card text-card-foreground">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <span className="font-bold tracking-wider text-xl uppercase">Gappify</span>
            </div>
            <span className="ml-2 font-semibold text-lg text-muted-foreground border-l pl-4">
              Test Script Manager
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<div className="p-6 md:p-10 max-w-7xl mx-auto w-full"><Dashboard /></div>} />
            <Route path="/admin/scripts/:scriptId" element={<ScriptEditor />} />
            <Route path="/execute/:scriptId" element={<ExecutionView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
