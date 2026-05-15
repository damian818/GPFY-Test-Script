import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { api } from '@/lib/api';
import { TestScript, TestScriptStep } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, MoveUp, MoveDown, Trash2, Save } from 'lucide-react';

export default function TestScriptEditor() {
  const { scriptId } = useParams();
  const [script, setScript] = useState<TestScript | null>(null);
  const [steps, setSteps] = useState<TestScriptStep[]>([]);
  const [loading, setLoading] = useState(true);

  // New step form
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
    
    // Persist to DB (ideally in a batch)
    try {
      await api.updateScriptStep(updated[index].id, { order_index: index });
      await api.updateScriptStep(updated[index + direction].id, { order_index: index + direction });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!script) return <div>Script not found.</div>;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" render={<Link to="/" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{script.title}</h1>
          <p className="text-muted-foreground">Edit script steps and configurations.</p>
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
                <Label className="text-xs text-muted-foreground">Instruction / Activity</Label>
                <p className="mt-1 font-medium">{step.instruction}</p>
              </div>
              {step.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Notes</Label>
                  <p className="mt-1 text-sm bg-muted/50 p-2 rounded">{step.notes}</p>
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
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section / Module</Label>
                <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. Accrual Manager" />
              </div>
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
              <Label>Internal Notes / Guidance</Label>
              <Textarea 
                value={newNotes} 
                onChange={e => setNewNotes(e.target.value)} 
                placeholder="Optional notes to help the tester..." 
                rows={2}
              />
            </div>
            <Button onClick={handleAddStep} disabled={!newInstruction}>
              <Plus className="h-4 w-4 mr-2" /> Add Step
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
