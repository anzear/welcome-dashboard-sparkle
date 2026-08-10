import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Eye, EyeOff, Check } from 'lucide-react';
import vcgInfinity from '@/assets/vcg-infinity.png';

const authSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/');
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const v = authSchema.parse({ email, password });
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message.includes('Invalid login credentials')
            ? 'Invalid email or password. Please try again.'
            : error.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: 'Check your details', description: err.errors[0].message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 lg:p-6">
      <div className="w-full max-w-[1280px] max-h-[calc(100vh-2rem)] lg:max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(11,18,34,0.15)] flex flex-col md:flex-row overflow-hidden">

        {/* Left brand panel */}
        <div className="hidden md:flex md:w-[55%] bg-[hsl(var(--card-foreground))] relative flex-col items-start p-10 lg:p-14 justify-center gap-10 overflow-hidden">

          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-[160px]" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <img src={vcgInfinity} alt="" className="h-20 w-auto object-contain -my-3 drop-shadow-[0_4px_24px_hsl(var(--primary)/0.45)]" />
            <span className="text-white font-bold text-5xl tracking-tight leading-none">vcg.ai</span>
          </div>

          <div className="relative z-10 max-w-lg">
            <h1 className="text-white font-bold text-3xl lg:text-4xl leading-[1.2] tracking-tight">
              Decision Intelligence for Your Future Product Success
            </h1>
          </div>

          <div className="relative z-10 flex gap-6">

            <button className="text-xs text-muted-foreground hover:text-white transition-colors">Privacy Policy</button>
            <button className="text-xs text-muted-foreground hover:text-white transition-colors">Terms of Service</button>
            <button className="text-xs text-muted-foreground hover:text-white transition-colors">Help Center</button>
          </div>


        </div>


        {/* Right sign-in panel */}
        <div className="w-full md:w-[45%] bg-card p-8 md:p-12 lg:p-16 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-sm w-full mx-auto mt-2">
            {/* Mobile brand */}
            <div className="flex md:hidden items-center gap-2 mb-8">
              <img src={vcgInfinity} alt="" className="h-7 w-7 object-contain" />
              <span className="font-bold text-lg text-[hsl(var(--card-foreground))] tracking-tight">vcg.ai</span>
            </div>

            <div className="mb-10">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] block mb-2">
                Sign In
              </span>
              <h2 className="text-2xl font-bold text-[hsl(var(--card-foreground))] mb-1">Welcome back</h2>
              <p className="text-xs text-muted-foreground">Enter your credentials to access your workspace.</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] block mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full h-11 px-4 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[10px] font-bold text-[hsl(var(--primary))] uppercase tracking-wider hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full h-11 px-4 pr-10 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group select-none !mt-2">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 border border-border rounded bg-white peer-checked:bg-primary peer-checked:border-[hsl(var(--primary))] transition-all" />
                  {showPassword && (
                    <Check className="absolute top-0.5 left-0.5 w-3 h-3 text-white pointer-events-none" strokeWidth={3} />
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Show my password
                </span>
              </label>


              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[hsl(var(--card-foreground))] text-white text-sm font-semibold rounded-lg hover:bg-[hsl(222_47%_16%)] active:scale-[0.98] transition-all shadow-lg shadow-black/10 disabled:opacity-70"
              >
                {isLoading ? 'Signing in…' : 'Sign in to account'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-center text-xs text-muted-foreground">
                Don't have an account?{' '}
                <span className="text-[hsl(var(--card-foreground))] font-semibold">Contact your admin</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
