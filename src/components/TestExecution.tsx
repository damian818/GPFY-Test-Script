import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { api } from '@/lib/api';
import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, CheckCircle2, XCircle, UploadCloud, ChevronRight, ChevronLeft, Save } from 'lucide-react';

export default function TestExecutionView() {
  const { scriptId } = useParams();
  const [script, setScript] = useState<TestScript | null>(null);
  const [steps, setSteps] = useState<TestScriptStep[]>([]);
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [execSteps, setExecSteps] = useState<Record<string, TestExecutionStep>>({});
  
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [started, setStarted] = useState(false);
  
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

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

  const startExecution = async () => {
    if (!email) return;
    try {
      const exec = await api.createExecution({
        script_id: scriptId!,
        tester_email: email,
        status: 'in_progress'
      });
      setExecution(exec);
      setStarted(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStepStatus = async (stepId: string, status: 'pass' | 'fail') => {
    if (!execution) return;
    try {
      const updated = await api.updateExecutionStep(execution.id, stepId, { status });
      setExecSteps(prev => ({ ...prev, [stepId]: updated }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStepComment = async (stepId: string, comments: string) => {
    if (!execution) return;
    try {
      const updated = await api.updateExecutionStep(execution.id, stepId, { comments });
      setExecSteps(prev => ({ ...prev, [stepId]: updated }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (stepId: string, file: File) => {
    if (!execution) return;
    try {
      const url = await api.uploadMedia(file);
      const updated = await api.updateExecutionStep(execution.id, stepId, { uploaded_media_url: url });
      setExecSteps(prev => ({ ...prev, [stepId]: updated }));
    } catch (e) {
      console.error(e);
      alert('Failed to upload file');
    }
  };

  const finishExecution = async () => {
    if (!execution) return;
    try {
      await api.updateExecution(execution.id, { status: 'completed' });
      setCurrentStepIdx(steps.length); // move to summary screen
    } catch (e) {
      console.error(e);
    }
  };

  const submitFeedback = async (rating: number, feedback: string) => {
     if (!execution) return;
     try {
       await api.updateExecution(execution.id, { rating, feedback });
       alert("Thank you! Feedback submitted.");
     } catch (e) {
       console.error(e);
     }
  };

  if (loading) return <div>Loading...</div>;
  if (!script) return <div>Script not found.</div>;

  if (!started) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950 text-slate-200 font-sans p-6">
         <Card className="w-full max-w-xl bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
           <CardHeader>
             <CardTitle className="text-2xl text-white">{script.title}</CardTitle>
             <CardDescription className="text-slate-400">{script.description}</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label className="text-slate-300">Enter your email to begin testing</Label>
               <Input 
                 type="email" 
                 placeholder="tester@gappify.com" 
                 value={email} 
                 onChange={e => setEmail(e.target.value)} 
                 className="bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500"
               />
             </div>
           </CardContent>
           <CardFooter>
             <Button onClick={startExecution} disabled={!email} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">Start Testing</Button>
           </CardFooter>
         </Card>
      </div>
    );
  }

  if (currentStepIdx >= steps.length) {
    // Summary & Feedback Screen
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950 text-slate-200 font-sans p-6">
        <div className="w-full max-w-xl space-y-6">
          <h2 className="text-3xl font-bold text-center text-white">Testing Completed</h2>
          <Card className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
          <CardHeader>
            <CardTitle>Provide Feedback</CardTitle>
            <CardDescription className="text-slate-400">How helpful was this test script?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex space-x-2 justify-center py-4">
                {[1,2,3,4,5].map(star => (
                   <Button key={star} variant="outline" className="border-slate-700 hover:bg-slate-800" onClick={() => submitFeedback(star, '')}>
                      {star} {star === 1 ? 'Star' : 'Stars'}
                   </Button>
                ))}
             </div>
             <Textarea className="bg-slate-950 border-slate-800 text-slate-300" placeholder="Any additional feedback on the UAT process?" rows={4} />
             <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" onClick={() => alert("Done!")}>Submit Feedback</Button>
          </CardContent>
        </Card>
        <Button variant="link" render={<Link to="/" />} className="w-full text-slate-400 hover:text-slate-200">
           Back to Dashboard
        </Button>
        </div>
      </div>
    );
  }

  const step = steps[currentStepIdx];
  const execStep = execSteps[step.id] || { status: 'not_started' };

  return (
    <div className="flex flex-1 min-h-0 bg-slate-950 text-slate-200 font-sans w-full h-full overflow-hidden">
      {/* Sidebar: Steps List */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
            Script Progress ({currentStepIdx + 1}/{steps.length})
          </div>
          <div className="space-y-1">
            {steps.map((s, idx) => {
              const sStatus = execSteps[s.id]?.status;
              let bgClass = "hover:bg-slate-800/50 text-slate-500";
              let iconClass = "border-slate-700 text-slate-500";
              let iconContent = idx + 1;
              
              if (idx === currentStepIdx) {
                bgClass = "bg-blue-500/20 border border-blue-500/50 text-white font-medium";
                iconClass = "bg-blue-500 border-blue-500 text-white";
              } else if (sStatus === 'pass') {
                bgClass = "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400";
                iconClass = "border-emerald-500 text-emerald-400";
                iconContent = "✓" as any;
              } else if (sStatus === 'fail') {
                bgClass = "bg-red-500/10 border border-red-500/20 text-red-400";
                iconClass = "border-red-500 text-red-400";
                iconContent = "✕" as any;
              }
              
              return (
                <button 
                  key={s.id}
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`w-full text-left flex items-center justify-start gap-3 p-2 rounded-md text-sm transition-colors ${bgClass}`}
                >
                  <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${iconClass}`}>
                    {iconContent}
                  </span>
                  <span className="truncate">{s.instruction.split('\n')[0] || `Step ${idx+1}`}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800 shrink-0">
          <Link to={`/admin/scripts/${script.id}`}>
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors">
              Edit Steps (Admin)
            </button>
          </Link>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex flex-col shadow-2xl overflow-hidden min-h-[400px]">
          {/* Instruction Header */}
          <div className="p-6 border-b border-slate-800 shrink-0 flex justify-between items-start">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-2">{step.section}</div>
              <h2 className="text-2xl font-bold text-white mb-2">Step {currentStepIdx + 1}</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-3xl whitespace-pre-wrap">{step.instruction}</p>
            </div>
          </div>

          {/* Visual Aid / Reference Video Area (Placeholder logic for media_url if exists later) */}
          <div className="flex-1 bg-black/40 relative flex items-center justify-center p-4">
            <div className="absolute top-4 left-4 bg-slate-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-700">Media Viewer</div>
            {step.media_url ? (
               <img src={step.media_url} alt="Step reference" className="max-w-full max-h-full object-contain rounded-lg border border-slate-700" />
            ) : (
               <div className="w-full h-full border border-slate-700 border-dashed rounded-lg bg-slate-800/50 flex flex-col items-center justify-center group overflow-hidden opacity-50">
                   <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                     <span className="text-slate-500 text-xs">No Media</span>
                   </div>
                   <p className="text-slate-500 text-xs">Admin did not attach reference media</p>
               </div>
            )}
            {step.notes && (
              <div className="absolute bottom-4 left-4 right-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-500/90 flex gap-2 items-start backdrop-blur-sm">
                <span className="font-bold shrink-0">Note:</span>
                <span className="whitespace-pre-wrap">{step.notes}</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interaction Panel */}
      <aside className="w-80 border-l border-slate-800 bg-slate-900/30 flex flex-col p-6 space-y-6 shrink-0 overflow-y-auto">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-3">Evidence Upload</label>
          <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-900/50 group">
            <Input 
              type="file" 
              accept="image/*,.pdf,.csv" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                   handleFileUpload(step.id, e.target.files[0]);
                }
              }}
            />
            <div className={`text-2xl mb-2 transition-colors ${execStep.uploaded_media_url ? 'text-emerald-500' : 'text-blue-500'}`}>
              {execStep.uploaded_media_url ? '✅' : '📁'}
            </div>
            <p className="text-xs text-slate-400 group-hover:text-blue-400 transition-colors">
              {execStep.uploaded_media_url ? 'File uploaded (Click to replace)' : 'Drop JPG, PNG, GIF, PDF or CSV'}
            </p>
            <p className="text-[10px] text-slate-600 mt-1">Maximum size 15MB</p>
          </div>
          {execStep.uploaded_media_url && (
            <div className="mt-3 text-right">
              <a href={execStep.uploaded_media_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">View Uploaded Document</a>
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-3">Outcome</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleStepStatus(step.id, 'pass')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition-all ${execStep.status === 'pass' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-300'}`}
            >
              <span className="text-lg">✓</span> 
              <span className="text-xs font-semibold uppercase tracking-wider">Pass</span>
            </button>
            <button 
              onClick={() => handleStepStatus(step.id, 'fail')}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition-all ${execStep.status === 'fail' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-300'}`}
            >
              <span className="text-lg">✕</span> 
              <span className="text-xs font-semibold uppercase tracking-wider">Fail</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[120px]">
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-3">Notes & Comments</label>
          <textarea 
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" 
            placeholder="Add internal notes about this step..."
            defaultValue={execStep.comments || ''}
            onBlur={(e) => handleStepComment(step.id, e.target.value)}
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col gap-3 shrink-0">
          <div className="flex gap-3">
             <button 
                disabled={currentStepIdx === 0}
                onClick={() => setCurrentStepIdx(p => Math.max(0, p - 1))}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
             >
                <ChevronLeft className="w-4 h-4" /> Prev
             </button>
             
             {currentStepIdx === steps.length - 1 ? (
               <button 
                 onClick={finishExecution} 
                 className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
               >
                 Finish <CheckCircle2 className="w-4 h-4" />
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentStepIdx(p => p + 1)}
                 className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-1"
               >
                 Next <ChevronRight className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>
      </aside>
    </div>
  );
}
