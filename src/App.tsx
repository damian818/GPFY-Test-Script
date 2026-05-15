import { BrowserRouter, Routes, Route } from 'react-router';
import { useState, useEffect } from 'react';
import { Moon, Sun, Settings } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import TestScriptEditor from '@/components/TestScriptEditor';
import TestExecutionView from '@/components/TestExecution';
import { Button } from './components/ui/button';
import { supabase } from '@/lib/supabase';

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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
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
            {!supabase && (
              <div className="text-sm bg-destructive/10 text-destructive px-3 py-1 rounded-full font-medium">
                Supabase Not Connected
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col w-full h-full">
          {!supabase ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-lg m-6 shrink-0">
              <h2 className="text-xl font-bold flex items-center mb-2">
                <Settings className="mr-2" /> Supabase Configuration Required
              </h2>
              <p className="mb-4">
                To use this application fully, you must provide your Supabase credentials in your secrets or .env.
              </p>
              <div className="bg-background/50 p-4 rounded text-sm font-mono whitespace-pre-wrap text-foreground">
                {`VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"`}
              </div>
              <p className="mt-4 text-sm font-semibold">
                Running in Mock Mode for demonstration. Data will not be persisted.
              </p>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto h-full flex flex-col">
            <Routes>
              <Route path="/" element={<div className="p-6 md:p-10 max-w-7xl mx-auto w-full"><Dashboard /></div>} />
              <Route path="/admin/scripts/:scriptId" element={<div className="p-6 md:p-10 max-w-7xl mx-auto w-full"><TestScriptEditor /></div>} />
              <Route path="/execute/:scriptId" element={<TestExecutionView />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
