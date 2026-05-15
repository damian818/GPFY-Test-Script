import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../lib/api';
import { TestScript } from '../lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { PlusCircle, Play, Settings2 } from 'lucide-react';

export default function Dashboard() {
  const [scripts, setScripts] = useState<TestScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    loadScripts();
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await api.getScripts();
      setScripts(data);
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
          <h1 className="text-3xl font-bold tracking-tight">Test Scripts</h1>
          <p className="text-muted-foreground mt-1">Manage and execute interactive UAT scripts.</p>
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
                Define a new script for user acceptance testing. You can add steps in the next screen.
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

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted/50 rounded-t-lg" />
              <CardContent className="h-20" />
            </Card>
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
            <Card key={script.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{script.title}</CardTitle>
                <CardDescription className="line-clamp-2">{script.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-muted-foreground">
                Created: {new Date(script.created_at).toLocaleDateString()}
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button render={<Link to={`/admin/scripts/${script.id}`} />} variant="outline" className="flex-1">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Edit
                </Button>
                <Button render={<Link to={`/execute/${script.id}`} />} className="flex-1">
                    <Play className="mr-2 h-4 w-4" />
                    Run
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
