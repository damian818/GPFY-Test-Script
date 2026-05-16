import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import Papa from 'papaparse';
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
  Check,
  FileText,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Tag,
  Filter,
  Database,
  Copy,
  PlayCircle,
  Image,
  BarChart2,
  GitBranch,
  GitPullRequest
} from 'lucide-react';
import { api } from './lib/api.ts';
import { supabase } from './lib/supabase.ts';
import { TestScript, TestScriptStep, TestExecution, TestExecutionStep } from './lib/types.ts';

// UI Components
import { Button } from './components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card.tsx';
import { Input } from './components/ui/input.tsx';
import { Label } from './components/ui/label.tsx';
import { Textarea } from './components/ui/textarea.tsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select.tsx';

// --- Bulk Upload Component ---
function BulkUploadDialog({ onComplete }: { onComplete: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        
        // Clean keys (remove BOM and trim)
        const cleanRows = rows.map(r => {
           const cleaned: Record<string, any> = {};
           for (const [k, v] of Object.entries(r)) {
              const cleanKey = k.replace(/^\uFEFF/, '').trim();
              cleaned[cleanKey] = v;
           }
           return cleaned;
        });

        setProgress({ current: 0, total: cleanRows.length });
        
        // Group by title
        const scriptsMap = new Map<string, { description: string, category: string, steps: any[] }>();
        
        const getVal = (row: any, ...keys: string[]) => {
           for (const k of keys) {
              if (row[k] !== undefined) return row[k];
              const found = Object.keys(row).find(x => x.toLowerCase() === k.toLowerCase());
              if (found) return row[found];
           }
           return '';
        };

        cleanRows.forEach(row => {
          console.log('Processing clean row:', row);
          const title = getVal(row, 'Script Title', 'Title') || 'Untitled Script';
          if (!scriptsMap.has(title)) {
            scriptsMap.set(title, {
              description: getVal(row, 'Script Description', 'Description'),
              category: getVal(row, 'Category') || 'General',
              steps: []
            });
          }
          const step = {
            section: getVal(row, 'Category', 'Section', 'Module') || 'General',
            instruction: getVal(row, 'Step Instruction', 'Instruction'),
            notes: getVal(row, 'Expected Outcome', 'Expected Result', 'Notes'),
            test_data: getVal(row, 'Test Data'),
            order_index: parseInt(getVal(row, 'Order Index')) || scriptsMap.get(title)!.steps.length || 0
          };
          if (step.instruction) {
             scriptsMap.get(title)?.steps.push(step);
          }
        });

        console.log('Parsed Scripts Map:', scriptsMap);

        let current = 0;
        for (const [title, data] of Array.from(scriptsMap.entries())) {
          try {
            const script = await api.createScript({
              title,
              description: data.description,
              category: data.category
            });

            for (const step of data.steps) {
              await api.createScriptStep({
                ...step,
                script_id: script.id
              });
              current++;
              setProgress(prev => ({ ...prev, current }));
            }
          } catch (err) {
            console.error(`Failed to upload script: ${title}`, err);
          }
        }

        setUploading(false);
        setIsOpen(false);
        onComplete();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" className="shadow-sm" />}>
        <UploadCloud className="mr-2 h-4 w-4" />
        Bulk Upload
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Massive Test Upload</DialogTitle>
          <DialogDescription>
            Import multiple scripts and steps via CSV. Use our template for best results.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/20 relative">
            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-center">
                  <p className="font-bold text-sm">Processing {progress.current} of {progress.total} rows</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Creating entities...</p>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <p className="text-sm font-medium text-center">Drag and drop or click to upload CSV</p>
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </>
            )}
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold">Download Template</p>
                <p className="text-[10px] text-muted-foreground">Standard CSV format</p>
              </div>
            </div>
            <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 text-xs font-bold" 
                render={<a href="/templates/bulk_test_upload.csv" download />}
            >
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Dashboard View ---
function Dashboard() {
  const [scripts, setScripts] = useState<TestScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [activeTab, setActiveTab] = useState<'scripts' | 'history' | 'analytics'>('scripts');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('Loading dashboard data...');
    setLoading(true);
    setDbError(null);
    try {
      const [scriptsData, executionsData] = await Promise.all([
        api.getScripts(),
        api.getExecutions()
      ]);
      console.log('Data loaded:', { scriptsCount: scriptsData.length });
      setScripts(scriptsData);
      setExecutions(executionsData);
      setSelectedScripts(new Set());
    } catch (e: any) {
      console.error(e);
      setDbError(e.message || 'Failed to connect to database');
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle) return;
    try {
      const script = await api.createScript({
        title: newTitle,
        description: newDesc,
        category: newCategory || 'General'
      });
      setIsDialogOpen(false);
      navigate(`/admin/scripts/${script.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ['All', ...Array.from(new Set(scripts.map(s => s.category || 'General')))];
  const filteredScripts = selectedCategory === 'All' 
    ? scripts 
    : scripts.filter(s => (s.category || 'General') === selectedCategory);

  const toggleSelectAll = () => {
    if (selectedScripts.size === filteredScripts.length) {
      setSelectedScripts(new Set());
    } else {
      setSelectedScripts(new Set(filteredScripts.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedScripts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedScripts(newSelected);
  };

  const deleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedScripts.size} script(s)?`)) return;
    
    setLoading(true);
    let errorCount = 0;
    for (const id of Array.from(selectedScripts)) {
      try {
        await api.deleteScript(id);
      } catch (e) {
        console.error('Delete failed for', id, e);
        errorCount++;
      }
    }
    
    if (errorCount > 0) {
      alert(`Failed to delete ${errorCount} script(s). Check RLS permissions.`);
    }
    
    await loadData();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">Gappify Testing</h1>
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${supabase ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
              <Database className="h-3 w-3" />
              {supabase ? 'Live: Supabase' : 'Demo: Mock Storage'}
            </div>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">Interactive UAT tracking and reporting for the modern enterprise.</p>
        </div>
        
        <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="flex bg-muted p-1 rounded-lg flex-1 md:flex-none">
                <button 
                    className={`flex-1 md:flex-none px-6 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'scripts' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                    onClick={() => setActiveTab('scripts')}
                >
                    Scripts
                </button>
                <button 
                    className={`flex-1 md:flex-none px-6 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                    onClick={() => setActiveTab('history')}
                >
                    History
                </button>
                <button 
                    className={`flex-1 md:flex-none px-6 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'analytics' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button className="shadow-lg shadow-primary/20" />}>
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
                    <Label htmlFor="category">Category</Label>
                    <div className="relative group">
                        <Input 
                            id="category" 
                            placeholder="e.g. Security, Training, Core" 
                            value={newCategory} 
                            onChange={e => setNewCategory(e.target.value)} 
                        />
                        <Tag className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Brief description of the goals..." 
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newTitle}>Create & Add Steps</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <BulkUploadDialog onComplete={loadData} />
        </div>
      </div>

      {!supabase && (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4 mb-8"
        >
            <div className="bg-amber-500 text-white p-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-widest">Persistence is disabled (Demo Mode)</h3>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                    You are currently using in-memory storage. <strong>Data will be lost on page refresh.</strong> 
                    To enable persistence, add your Supabase credentials in the <strong>Settings {'>'} Secrets</strong> panel.
                </p>
                <div className="flex gap-4 mt-3">
                    <div className="text-[9px] font-black uppercase bg-amber-500/5 px-2 py-1 rounded inline-block border border-amber-500/10">VITE_SUPABASE_URL</div>
                    <div className="text-[9px] font-black uppercase bg-amber-500/5 px-2 py-1 rounded inline-block border border-amber-500/10">VITE_SUPABASE_ANON_KEY</div>
                </div>
            </div>
        </motion.div>
      )}

      {supabase && dbError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-4 mb-8">
            <div className="bg-destructive text-white p-2 rounded-lg">
                <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-bold text-destructive uppercase tracking-widest">Database Schema Mismatch</h3>
                <p className="text-xs text-destructive/80 mt-1 leading-relaxed">
                    Connected to Supabase, but encountered an error. This usually means your database tables are missing or out of sync.
                </p>
                <div className="mt-2 p-2 bg-black/5 rounded text-[10px] font-mono text-destructive break-all">
                    {dbError}
                </div>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/20 hover:bg-destructive/10 text-destructive" onClick={() => window.open('/supabase-schema.sql', '_blank')}>
                View SQL Schema
            </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'scripts' ? (
          <motion.div
            key="scripts-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 text-xs font-bold whitespace-nowrap rounded-md transition-all duration-300 ${selectedCategory === cat ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground font-medium px-2">
                    {selectedScripts.size > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-destructive hover:bg-destructive/10 px-2" onClick={deleteSelected}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete ({selectedScripts.size})
                        </Button>
                    )}
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-foreground">
                        <input 
                            type="checkbox" 
                            className="rounded border-muted-foreground/30 text-primary focus:ring-primary w-3.5 h-3.5"
                            checked={selectedScripts.size === filteredScripts.length && filteredScripts.length > 0}
                            onChange={toggleSelectAll}
                        />
                        Select All
                    </label>
                    <div className="h-3 w-px bg-border mx-1"></div>
                    <Filter className="h-3 w-3" />
                    <span>{filteredScripts.length} Results</span>
                </div>
              </div>

              {loading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3].map(i => (
                      <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                  ))}
                  </div>
              ) : scripts.length === 0 ? (
                  <div className="text-center py-20 border rounded-xl border-dashed bg-card/50 flex flex-col items-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">No scripts found</h3>
                    <p className="text-muted-foreground mt-1 mb-6 max-w-xs">Get started by creating your first interactive test script for your team.</p>
                    <Button onClick={() => setIsDialogOpen(true)}>Create Script</Button>
                  </div>
              ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredScripts.map((script, idx) => (
                      <motion.div
                        key={script.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card className={`flex flex-col h-full hover:shadow-xl transition-all duration-300 border-l-4 group relative ${selectedScripts.has(script.id) ? 'border-primary shadow-md bg-primary/5' : 'border-l-primary/30'}`}>
                          <div className="absolute top-3 right-3 z-10">
                              <input 
                                  type="checkbox" 
                                  className="rounded border-muted-foreground/30 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  checked={selectedScripts.has(script.id)}
                                  onChange={() => toggleSelect(script.id)}
                              />
                          </div>
                          <CardHeader className="pb-3 pr-10">
                              <div className="flex justify-between items-start mb-1">
                                  <div className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
                                      {script.category || 'General'}
                                  </div>
                              </div>
                              <CardTitle className="group-hover:text-primary transition-colors">{script.title}</CardTitle>
                              <CardDescription className="line-clamp-2 h-10">{script.description || 'No description provided.'}</CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 text-[11px] text-muted-foreground pt-0 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                              <Clock className="h-3 w-3" />
                              Created: {new Date(script.created_at).toLocaleDateString()}
                          </CardContent>
                          <CardFooter className="gap-2 border-t pt-4 bg-muted/20">
                              <Button render={<Link to={`/admin/scripts/${script.id}`} />} variant="outline" size="sm" className="flex-1 border-primary/20 hover:bg-primary/5">
                                  <Settings2 className="mr-2 h-3.5 w-3.5" />
                                  Schema
                              </Button>
                              <Button render={<Link to={`/execute/${script.id}`} />} size="sm" className="flex-1">
                                  <Play className="mr-2 h-3.5 w-3.5 fill-current" />
                                  Test Run
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                                  if (confirm('Are you sure you want to delete this script?')) {
                                      console.log('Attempting to delete script object:', script);
                                      try {
                                        await api.deleteScript(script.id);
                                        loadData();
                                      } catch (e) {
                                          console.error('Delete failed', e);
                                          alert('Failed to delete: ' + e);
                                      }
                                  }
                              }}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                  ))}
                  </div>
              )}
          </motion.div>
        ) : activeTab === 'history' ? (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
                {loading ? (
                    <div className="space-y-3">
                        {[1,2,3].map(i => <div key={i} className="h-16 w-full bg-muted animate-pulse rounded-lg" />)}
                    </div>
                ) : executions.length === 0 ? (
                    <div className="text-center py-20 border rounded-xl border-dashed bg-card/50 flex flex-col items-center">
                      <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">No execution history</h3>
                      <p className="text-muted-foreground mt-1">Run your first test script to see your team's execution history here.</p>
                    </div>
                ) : (
                    <Card className="overflow-hidden border-primary/10 shadow-lg shadow-primary/5">
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40">
                                        <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Script</th>
                                        <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Tester</th>
                                        <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Status</th>
                                        <th className="text-left py-4 px-6 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Date</th>
                                        <th className="text-right py-4 px-6 font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/30">
                                    {executions.map(exe => (
                                        <tr key={exe.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="py-4 px-6">
                                              <div className="font-bold">{(exe as any).test_scripts?.title || 'Unknown Script'}</div>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground">
                                              <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                  <User className="h-3 w-3 text-primary" />
                                                </div>
                                                {exe.tester_email}
                                              </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${exe.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full ${exe.status === 'completed' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                                    {exe.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground text-xs font-mono">{new Date(exe.created_at).toLocaleString()}</td>
                                            <td className="py-4 px-6 text-right">
                                                {exe.status === 'completed' ? (
                                                  <Button variant="outline" size="sm" render={<Link to={`/report/${exe.id}`} />} className="hover:bg-primary hover:text-white transition-all">
                                                      View Report
                                                  </Button>
                                                ) : (
                                                  <Button variant="default" size="sm" render={<Link to={`/execute/${exe.script_id}?executionId=${exe.id}`} />} className="shadow-md shadow-primary/10">
                                                      Resume Run
                                                  </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        ) : (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AnalyticsDashboard executions={executions} />
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Analytics Dashboard Component ---
function AnalyticsDashboard({ executions }: { executions: TestExecution[] }) {
  // 1. Trend Data (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), i);
    return {
      dateStr: format(date, 'MMM dd'),
      date: startOfDay(date),
      pass: 0,
      fail: 0,
      total: 0,
      avgCompletion: 0,
      completionSum: 0,
      durationSum: 0,
      durationCount: 0,
      avgDuration: 0
    };
  }).reverse();

  executions.forEach(exe => {
    const exeDate = new Date(exe.created_at);
    const day = last7Days.find(d => 
      exeDate.getDate() === d.date.getDate() && 
      exeDate.getMonth() === d.date.getMonth()
    );
    if (day) {
      day.total++;
      if (exe.status === 'completed') {
        day.pass++;
        if (exe.completed_at) {
          const duration = (new Date(exe.completed_at).getTime() - new Date(exe.created_at).getTime()) / 1000 / 60; // in minutes
          day.durationSum += duration;
          day.durationCount++;
        }
      } else {
        day.fail++;
      }

      if (exe.total_steps && exe.total_steps > 0) {
        const completion = ((exe.passed_steps || 0) + (exe.failed_steps || 0)) / exe.total_steps;
        day.completionSum += completion * 100;
      }
    }
  });

  // Calculate averages
  last7Days.forEach(day => {
    if (day.total > 0) day.avgCompletion = Math.round(day.completionSum / day.total);
    if (day.durationCount > 0) day.avgDuration = Number((day.durationSum / day.durationCount).toFixed(1));
  });

  // 2. Status Distribution
  const statusData = [
    { name: 'Completed', value: executions.filter(e => e.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: executions.filter(e => e.status === 'in_progress').length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // 3. Stats
  const totalExecutions = executions.length;
  const completionRate = totalExecutions > 0 
    ? Math.round((executions.filter(e => e.status === 'completed').length / totalExecutions) * 100) 
    : 0;
  
  const completedStats = executions.filter(e => e.status === 'completed' && e.completed_at);
  const avgSessionTime = completedStats.length > 0
    ? (completedStats.reduce((acc, curr) => acc + (new Date(curr.completed_at!).getTime() - new Date(curr.created_at).getTime()), 0) / completedStats.length / 1000 / 60).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Total Runs</CardDescription>
            <CardTitle className="text-3xl font-black">{totalExecutions}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-green-500/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600/60">Completion Rate</CardDescription>
            <CardTitle className="text-3xl font-black text-green-600">{completionRate}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-blue-500/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60">Avg. Duration</CardDescription>
            <CardTitle className="text-3xl font-black text-blue-600">{avgSessionTime}m</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-amber-500/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600/60">Active Sessions</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600">{executions.filter(e => e.status === 'in_progress').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg shadow-primary/5 border-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/10 pb-6 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Volume & Time Trends
            </CardTitle>
            <CardDescription>Daily execution count and average duration (min)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="dateStr" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', fontWeight: 700 }}
                  cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area 
                    name="Runs"
                    type="monotone" 
                    dataKey="total" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                    animationDuration={1500}
                />
                <Area 
                    name="Avg Duration (min)"
                    type="monotone" 
                    dataKey="avgDuration" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={0} 
                    strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg shadow-primary/5 border-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/10 pb-6 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-indigo-500" />
              Completion Depth
            </CardTitle>
            <CardDescription>Average % of script steps executed/passed</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="dateStr" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                  formatter={(value) => [`${value}%`, 'Avg Completion']}
                />
                <Bar 
                  dataKey="avgCompletion" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg shadow-primary/5 border-primary/5 overflow-hidden">
          <CardHeader className="bg-muted/10 pb-6 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-500" />
              Outcome Breakdown
            </CardTitle>
            <CardDescription>Final session statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Failing Scripts Placeholder or similar */}
        <Card className="lg:col-span-2 shadow-lg shadow-primary/5 border-primary/5">
           <CardHeader className="bg-muted/10 pb-6 border-b">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Pass/Fail Performance
            </CardTitle>
            <CardDescription>Execution health by volume</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="dateStr" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700 }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="pass" name="Completed" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fail" name="Incomplete" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Report View ---
function ReportView() {
  const { executionId } = useParams();
  const [execution, setExecution] = useState<(TestExecution & { test_scripts: TestScript }) | null>(null);
  const [exeSteps, setExeSteps] = useState<(TestExecutionStep & { step: TestScriptStep })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (executionId) loadReport();
  }, [executionId]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const [exe, results, scriptSteps] = await Promise.all([
        api.getExecution(executionId!),
        api.getExecutionSteps(executionId!),
        // We need all steps for the script to show the full context
        null // We'll handle this below
      ]);

      if (exe) {
        const sSteps = await api.getScriptSteps(exe.script_id);
        const mapped = sSteps.map(ss => ({
          step: ss,
          ...(results.find(r => r.step_id === ss.id) || { status: 'not_started' as const, execution_id: executionId!, step_id: ss.id, id: '' })
        }));
        setExecution(exe as any);
        setExeSteps(mapped as any);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-muted-foreground">Generating report format...</div>;
  if (!execution) return <div className="p-20 text-center text-destructive">Report not found.</div>;

  const stats = {
    total: exeSteps.length,
    passed: exeSteps.filter(s => s.status === 'pass').length,
    failed: exeSteps.filter(s => s.status === 'fail').length,
    skipped: exeSteps.filter(s => s.status === 'not_started').length
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto py-10 px-6 space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" render={<Link to="/" />} className="-ml-3 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{execution.test_scripts.title} - Session Log</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5 font-medium"><User className="h-3.5 w-3.5" /> {execution.tester_email}</span>
            <span className="flex items-center gap-1.5 font-medium"><Clock className="h-3.5 w-3.5" /> {new Date(execution.created_at).toLocaleString()}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${execution.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {execution.status}
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-muted/50 p-3 rounded-xl border border-primary/5 flex gap-4 min-w-[240px]">
            <div className="flex-1 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pass</div>
              <div className="text-xl font-bold text-green-600">{stats.passed}</div>
            </div>
            <div className="w-px bg-muted-foreground/20 h-full" />
            <div className="flex-1 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Fail</div>
              <div className="text-xl font-bold text-destructive">{stats.failed}</div>
            </div>
            <div className="w-px bg-muted-foreground/20 h-full" />
            <div className="flex-1 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Completion</div>
              <div className="text-xl font-bold">{Math.round((stats.passed + stats.failed) / stats.total * 100)}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Detailed Activity Logs
        </h2>
        
        {exeSteps.map((stepResult, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className={`overflow-hidden border-l-4 transition-shadow hover:shadow-md ${stepResult.status === 'pass' ? 'border-l-green-500' : stepResult.status === 'fail' ? 'border-l-destructive' : 'border-l-muted'}`}>
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-3/5 p-6 border-r border-muted/30">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{stepResult.step.section}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      stepResult.status === 'pass' ? 'bg-green-100 text-green-700' : 
                      stepResult.status === 'fail' ? 'bg-destructive/10 text-destructive' : 
                      'bg-muted text-muted-foreground'
                    }`}>
                      {stepResult.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2">Step {idx + 1}: {stepResult.step.instruction}</h3>
                   <div className="flex flex-wrap gap-4 mt-3">
                      {stepResult.step.notes && (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded italic flex-1 border border-dotted">
                          Expected: {stepResult.step.notes}
                        </p>
                      )}
                      {stepResult.step.test_data && (
                        <div className="flex items-center gap-2 bg-primary/5 px-3 py-2 rounded-lg border border-primary/20">
                          <Database className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-bold text-primary tracking-tight">{stepResult.step.test_data}</span>
                        </div>
                      )}
                      {stepResult.step.linked_step_id && (() => {
                        const linked = exeSteps.find(s => s.step.id === stepResult.step.linked_step_id);
                        if (!linked) return null;
                        const linkedIdx = exeSteps.indexOf(linked) + 1;
                        return (
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border border-muted-foreground/10">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Linked to Step {linkedIdx}</span>
                          </div>
                        );
                      })()}
                   </div>
                  
                  {stepResult.comments && (
                    <div className="mt-4 pt-4 border-t border-muted/40">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-2">Tester Comments</Label>
                      <p className="text-sm font-medium">{stepResult.comments}</p>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-2/5 bg-muted/10 p-6 flex flex-col justify-center items-center">
                  {stepResult.uploaded_media_url ? (
                    <div className="space-y-3 w-full">
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block text-center">Execution Evidence</Label>
                      <div className="relative aspect-video rounded-lg overflow-hidden border shadow-inner bg-black">
                        {stepResult.uploaded_media_url.match(/\.(mp4|webm)$/) ? (
                          <video src={stepResult.uploaded_media_url} controls className="w-full h-full object-contain" />
                        ) : (
                          <img src={stepResult.uploaded_media_url} alt="Evidence" className="w-full h-full object-contain" />
                        )}
                        <a 
                          href={stepResult.uploaded_media_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-md hover:bg-black/80 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-muted/20 rounded-lg w-full flex flex-col items-center">
                      <AlertCircle className="h-5 w-5 text-muted-foreground/40 mb-2" />
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">No evidence attached</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
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
  const [newTestData, setNewTestData] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newLinkedStepId, setNewLinkedStepId] = useState<string>('none');
  const [stepMediaUploading, setStepMediaUploading] = useState(false);

  const [editScript, setEditScript] = useState<{ title: string, description: string, category: string } | null>(null);
  const [savingScript, setSavingScript] = useState(false);

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
      if (s) setEditScript({ title: s.title, description: s.description, category: s.category || 'General' });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpdateScript = async () => {
    if (!editScript || !script) return;
    setSavingScript(true);
    try {
      const updated = await api.updateScript(script.id, editScript);
      setScript(updated);
    } catch (e) {
      console.error(e);
    }
    setSavingScript(false);
  };

  const handleAddStep = async () => {
    if (!newInstruction) return;
    try {
      const step = await api.createScriptStep({
        script_id: scriptId!,
        section: newSection || 'General',
        instruction: newInstruction,
        notes: newNotes,
        test_data: newTestData,
        media_url: newMediaUrl,
        linked_step_id: newLinkedStepId === 'none' ? undefined : newLinkedStepId,
        order_index: steps.length
      });
      setSteps([...steps, step]);
      setNewInstruction('');
      setNewNotes('');
      setNewTestData('');
      setNewMediaUrl('');
      setNewLinkedStepId('none');
    } catch (e) {
      console.error(e);
    }
  };

  const handleStepMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean, stepId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStepMediaUploading(true);
    try {
      const url = await api.uploadMedia(file);
      if (isNew) {
        setNewMediaUrl(url);
      } else if (stepId) {
        await api.updateScriptStep(stepId, { media_url: url });
        setSteps(steps.map(s => s.id === stepId ? { ...s, media_url: url } : s));
      }
    } catch (err) {
      console.error(err);
    }
    setStepMediaUploading(false);
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
          <p className="text-muted-foreground flex items-center gap-2">
            <Tag className="h-3 w-3" />
            {script.category || 'General'}
          </p>
        </div>
      </div>

      <Card className="bg-muted/10 border-primary/10 shadow-sm">
          <CardHeader className="pb-3 border-b bg-card">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <Settings2 className="h-4 w-4 text-primary" />
                 Metadata & Context
              </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid gap-4 bg-card">
              <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
                      <Input 
                        value={editScript?.title} 
                        onChange={e => setEditScript(prev => prev ? { ...prev, title: e.target.value } : null)} 
                      />
                  </div>
                  <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Input 
                        value={editScript?.category} 
                        onChange={e => setEditScript(prev => prev ? { ...prev, category: e.target.value } : null)} 
                        placeholder="e.g. Training, Security"
                      />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                  <Textarea 
                    value={editScript?.description} 
                    onChange={e => setEditScript(prev => prev ? { ...prev, description: e.target.value } : null)} 
                    rows={2}
                  />
              </div>
          </CardContent>
          <CardFooter className="justify-end border-t border-primary/5 bg-card py-3">
              <Button size="sm" onClick={handleUpdateScript} disabled={savingScript}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingScript ? 'Saving...' : 'Sync Schema'}
              </Button>
          </CardFooter>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Steps ({steps.length})</h2>
        
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader className="py-4 bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                 <Input 
                    value={step.section} 
                    onChange={async (e) => {
                        const val = e.target.value;
                        setSteps(steps.map(s => s.id === step.id ? { ...s, section: val } : s));
                        await api.updateScriptStep(step.id, { section: val });
                    }}
                    className="h-6 px-1 py-0 text-[10px] font-bold text-primary uppercase tracking-widest border-none bg-transparent hover:bg-primary/5 focus:bg-primary/5 transition-colors w-auto inline-block"
                 />
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
            <CardContent className="py-6 space-y-6">
              <div className="grid md:grid-cols-12 gap-8">
                <div className="md:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Functional Instruction</Label>
                    <Textarea 
                        value={step.instruction}
                        onChange={async (e) => {
                            const val = e.target.value;
                            setSteps(steps.map(s => s.id === step.id ? { ...s, instruction: val } : s));
                            await api.updateScriptStep(step.id, { instruction: val });
                        }}
                        className="text-base font-bold leading-tight resize-none border-2 focus:ring-primary/20"
                        placeholder="What should the user do?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Outcome / Validation Notes</Label>
                    <Textarea 
                        value={step.notes || ''}
                        onChange={async (e) => {
                            const val = e.target.value;
                            setSteps(steps.map(s => s.id === step.id ? { ...s, notes: val } : s));
                            await api.updateScriptStep(step.id, { notes: val });
                        }}
                        placeholder="What constitutes a 'Pass' for this step?"
                        className="text-sm bg-muted/20 border-muted/50 resize-none"
                    />
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col gap-5">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-dashed border-muted-foreground/20 space-y-5">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                            <Settings2 className="h-3 w-3" />
                            Step Configuration
                        </Label>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Required Test Data / Inputs</Label>
                        <div className="relative group">
                            <Input 
                                value={step.test_data || ''} 
                                placeholder="e.g. USER_PROD_01, TEST_CREDIT_CARD"
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setSteps(steps.map(s => s.id === step.id ? { ...s, test_data: val } : s));
                                    await api.updateScriptStep(step.id, { test_data: val });
                                }}
                                className="bg-background font-mono text-xs border-primary/10 h-9"
                            />
                            <Database className="absolute right-3 top-2.5 h-3.5 w-3.5 text-primary/30" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Flow Dependency (Link Step)</Label>
                        <Select 
                            value={step.linked_step_id || 'none'} 
                            onValueChange={async (val) => {
                                const linkedId = val === 'none' ? undefined : val;
                                setSteps(steps.map(s => s.id === step.id ? { ...s, linked_step_id: linkedId } : s));
                                await api.updateScriptStep(step.id, { linked_step_id: linkedId });
                            }}
                        >
                            <SelectTrigger className="w-full bg-background border-primary/10 h-9 text-xs">
                                <SelectValue placeholder="No dependency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No dependency</SelectItem>
                                {steps.filter(s => s.id !== step.id).map((s, i) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        Step {steps.indexOf(s) + 1}: {s.instruction.substring(0, 30)}...
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Media Attachment (Reference)</Label>
                        {step.media_url ? (
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border shadow-sm group">
                                {step.media_url.match(/\.(mp4|webm)$/) ? (
                                    <video src={step.media_url} controls className="w-full h-full object-contain" />
                                ) : (
                                    <img src={step.media_url} alt="Step Aid" className="w-full h-full object-contain" />
                                )}
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    onClick={() => {
                                        api.updateScriptStep(step.id, { media_url: '' });
                                        setSteps(steps.map(s => s.id === step.id ? { ...s, media_url: undefined } : s));
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <div className="h-20 border-2 border-dotted rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-background/50 relative cursor-pointer hover:bg-background/80 hover:border-primary/30 transition-all">
                                <UploadCloud className="h-5 w-5 mb-1 text-primary/40" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Upload Visual Aid</span>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={(e) => handleStepMediaUpload(e, false, step.id)}
                                    disabled={stepMediaUploading}
                                />
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="border-dashed border-2 bg-muted/5">
          <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Step Addition</CardTitle>
            <CardDescription className="font-medium">Define a new functional activity for this schema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Functional Area / Module</Label>
                    <Input value={newSection} onChange={e => setNewSection(e.target.value)} placeholder="e.g. Accrual Manager" className="border-2" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Init Test Data</Label>
                    <Input value={newTestData} onChange={e => setNewTestData(e.target.value)} placeholder="e.g. USER_01, INV_999" className="border-2 font-mono text-xs" />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Next Step Logic</Label>
                    <Select value={newLinkedStepId} onValueChange={setNewLinkedStepId}>
                        <SelectTrigger className="border-2 bg-background h-10">
                            <SelectValue placeholder="No link" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No dependency</SelectItem>
                            {steps.map((s, i) => (
                                <SelectItem key={s.id} value={s.id}>
                                    Step {i + 1}: {s.instruction.substring(0, 20)}...
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action Instruction *</Label>
              <Textarea 
                value={newInstruction} 
                onChange={e => setNewInstruction(e.target.value)} 
                placeholder="Clear, concise instruction for the tester..." 
                rows={2}
                className="border-2 text-lg font-bold"
              />
            </div>
            
            <div className="grid md:grid-cols-12 gap-6 bg-muted/20 p-6 rounded-2xl border border-muted/30">
                <div className="md:col-span-8 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expected Outcome</Label>
                    <Textarea 
                        value={newNotes} 
                        onChange={e => setNewNotes(e.target.value)} 
                        placeholder="What should be verified?" 
                        rows={3}
                        className="bg-background"
                    />
                </div>
                <div className="md:col-span-4 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference Media</Label>
                    <div className={`h-[82px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-background relative transition-all duration-300 ${newMediaUrl ? 'border-green-500 bg-green-50/50' : 'hover:border-primary/50'}`}>
                        {stepMediaUploading ? (
                            <div className="flex flex-col items-center gap-1">
                                <div className="h-4 w-4 border-t-2 border-primary rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-primary tracking-tighter">PROCESSING</span>
                            </div>
                        ) : newMediaUrl ? (
                            <div className="flex flex-col items-center">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-[10px] font-black text-green-600 uppercase">Attached</span>
                                <Button variant="ghost" size="xs" onClick={() => setNewMediaUrl('')} className="h-5 text-[9px] mt-1">Change</Button>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="h-5 w-5 mb-1 opacity-40 text-primary" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Upload</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => handleStepMediaUpload(e, true)}
                            disabled={stepMediaUploading}
                        />
                    </div>
                </div>
            </div>
            
            <Button onClick={handleAddStep} disabled={!newInstruction || stepMediaUploading} className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/10">
              <Plus className="h-5 w-5 mr-3" /> Commit & Stage Step
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
  const [searchParams] = useSearchParams();
  const executionIdParam = searchParams.get('executionId');
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
    if (scriptId) initializeExecution();
  }, [scriptId, executionIdParam]);

  const initializeExecution = async () => {
    setLoading(true);
    try {
      const s = await api.getScript(scriptId!);
      const st = await api.getScriptSteps(scriptId!);
      setScript(s);
      setSteps(st);

      if (executionIdParam) {
        const exe = await api.getExecution(executionIdParam);
        if (exe) {
          const results = await api.getExecutionSteps(executionIdParam);
          // Find first step without a result
          const lastIdx = st.findIndex(ss => !results.find(r => r.step_id === ss.id));
          setExecution(exe);
          setCurrentStepIndex(lastIdx === -1 ? 0 : lastIdx);
        }
      } else {
        const exe = await api.createExecution({
          script_id: scriptId!,
          status: 'in_progress',
          tester_email: 'damian@gappify.com'
        });
        setExecution(exe);
      }
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
        // Fetch stats before completing
        const results = await api.getExecutionSteps(execution.id);
        const passed = results.filter(r => r.status === 'pass').length;
        const failed = results.filter(r => r.status === 'fail').length;
        
        await api.updateExecution(execution.id, { 
          status: 'completed',
          completed_at: new Date().toISOString(),
          total_steps: steps.length,
          passed_steps: passed,
          failed_steps: failed
        });
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
    <div className="flex-1 flex flex-col items-center bg-muted/20 pb-10 min-h-screen">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full bg-card border-b py-4 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm"
      >
        <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" render={<Link to="/" />}>
                <XCircle className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="font-bold text-lg">{script.title}</h1>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Session</p>
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-6">
            <div className="text-right hidden sm:block">
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Progress</div>
                <div className="text-sm font-black">{currentStepIndex + 1} <span className="text-muted-foreground font-medium">/ {steps.length}</span></div>
            </div>
            <div className="w-40 h-2.5 bg-muted rounded-full overflow-hidden border">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                />
            </div>
        </div>
      </motion.div>

      <div className="w-full max-w-2xl mt-8 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <Card className="shadow-2xl border-primary/10 overflow-hidden ring-1 ring-primary/5">
                <CardHeader className="bg-primary/5 pt-8 pb-6 border-b">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2 py-0.5 rounded-md">{currentStep.section}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Step Indicator</span>
                    </div>
                    <CardTitle className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm">{currentStep.instruction}</CardTitle>
                </CardHeader>
                <CardContent className="py-8 space-y-8">
                    {currentStep.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-5 rounded-xl flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                            </div>
                            <div>
                                <Label className="text-amber-800 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest mb-1 block">Expected Outcome</Label>
                                <p className="text-amber-950 dark:text-amber-300 font-medium leading-relaxed">{currentStep.notes}</p>
                            </div>
                        </div>
                    )}

                    {currentStep.linked_step_id && (() => {
                        const linked = steps.find(s => s.id === currentStep.linked_step_id);
                        if (!linked) return null;
                        const linkedIndex = steps.indexOf(linked) + 1;
                        return (
                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <GitBranch className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Flow Dependency</p>
                                        <p className="text-sm font-bold">Relates to Step {linkedIndex}: <span className="text-muted-foreground font-medium">{linked.instruction.substring(0, 40)}...</span></p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs font-bold hover:bg-primary/10"
                                    onClick={() => setCurrentStepIndex(linkedIndex - 1)}
                                >
                                    Jump to Reference
                                </Button>
                            </div>
                        );
                    })()}

                    <div className="grid md:grid-cols-2 gap-8">
                        {currentStep.test_data && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Database className="h-3 w-3" />
                                    Required Test Data
                                </Label>
                                <div className="bg-primary/5 border-2 border-primary/10 p-4 rounded-xl flex items-center justify-between group">
                                    <code className="text-primary font-black tracking-tighter text-lg">{currentStep.test_data}</code>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => navigator.clipboard.writeText(currentStep.test_data!)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep.media_url && (
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <PlayCircle className="h-3 w-3" />
                                    Reference Visual Aid
                                </Label>
                                <div className="relative aspect-video rounded-xl overflow-hidden border-2 bg-black shadow-lg">
                                    {currentStep.media_url.match(/\.(mp4|webm)$/) ? (
                                        <video src={currentStep.media_url} controls className="w-full h-full object-contain" />
                                    ) : (
                                        <img src={currentStep.media_url} alt="Step Aid" className="w-full h-full object-contain" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Verification Result</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant={status === 'pass' ? 'default' : 'outline'}
                                className={`h-24 flex-col gap-2 rounded-2xl transition-all duration-300 border-2 ${status === 'pass' ? 'bg-green-600 hover:bg-green-700 border-green-600 shadow-lg shadow-green-600/20' : 'hover:border-green-500/50 hover:bg-green-50/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                                onClick={() => setStatus('pass')}
                            >
                                <CheckCircle2 className={`h-8 w-8 ${status === 'pass' ? 'text-white' : 'text-green-500'}`} />
                                <span className="font-black text-xs tracking-widest">SUCCESSFUL</span>
                            </Button>
                            <Button 
                                variant={status === 'fail' ? 'destructive' : 'outline'}
                                className={`h-24 flex-col gap-2 rounded-2xl transition-all duration-300 border-2 ${status === 'fail' ? 'shadow-lg shadow-destructive/20 border-destructive' : 'hover:border-destructive/50 hover:bg-destructive/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
                                onClick={() => setStatus('fail')}
                            >
                                <XCircle className={`h-8 w-8 ${status === 'fail' ? 'text-white' : 'text-destructive'}`} />
                                <span className="font-black text-xs tracking-widest">FAILURE FOUND</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                        <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Execution Narrative</Label>
                        <div className="space-y-5">
                            <div className="relative group">
                                <Textarea 
                                    placeholder="Click to start typing your observations..."
                                    value={comments}
                                    onChange={e => setComments(e.target.value)}
                                    rows={4}
                                    className="resize-none rounded-xl border-2 focus:ring-4 transition-all duration-300"
                                />
                                <div className="absolute top-3 right-3 text-muted-foreground/30 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                                  <Settings className="h-4 w-4" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Visual Evidence</Label>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex-1">
                                        <Button 
                                            variant="outline" 
                                            className={`w-full h-32 flex-col gap-2 border-dashed border-2 rounded-2xl relative transition-all duration-300 ${mediaUrl ? 'border-green-500 bg-green-50/30' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                  <div className="h-6 w-6 border-t-2 border-primary rounded-full animate-spin" />
                                                  <span className="text-[10px] font-black text-primary">PROCESSING...</span>
                                                </div>
                                            ) : mediaUrl ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-green-500 p-2 rounded-full mb-2">
                                                      <Check className="h-5 w-5 text-white" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Asset Linked</span>
                                                    <span className="text-[9px] text-muted-foreground truncate max-w-[200px] mt-1 opacity-50">{mediaUrl}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="h-8 w-8 text-muted-foreground mb-1" />
                                                    <div className="text-center">
                                                        <div className="font-black text-[10px] uppercase tracking-widest">Inject Evidence</div>
                                                        <div className="text-[9px] text-muted-foreground mt-1">Image or Video Payload</div>
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
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 border-t p-8">
                    <Button 
                        className="w-full h-14 text-lg font-black uppercase tracking-[0.1em] shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]" 
                        onClick={saveCurrentStep} 
                        disabled={!status}
                    >
                        {currentStepIndex < steps.length - 1 ? 'Commit & Proceed' : 'Finalize Session'}
                        <ChevronRight className="ml-2 h-6 w-6" />
                    </Button>
                </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
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
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white">
        <header className="border-b px-6 py-4 flex items-center justify-between bg-card text-card-foreground sticky top-0 z-50">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg transition-transform group-hover:scale-110 duration-300">
              <span className="font-black tracking-wider text-xl uppercase">GP</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-extrabold text-lg tracking-tight">QA INFRA</span>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Enterprise Analytics</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-muted">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          <Routes>
            <Route path="/" element={<div className="p-6 md:p-10 max-w-7xl mx-auto w-full"><Dashboard /></div>} />
            <Route path="/admin/scripts/:scriptId" element={<ScriptEditor />} />
            <Route path="/execute/:scriptId" element={<ExecutionView />} />
            <Route path="/report/:executionId" element={<ReportView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
