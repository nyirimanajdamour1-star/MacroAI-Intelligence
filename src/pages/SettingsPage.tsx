import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Bell, RefreshCw, Key, Clock, Check } from 'lucide-react';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [refreshInterval, setRefreshInterval] = useState('30s');
  const [notifications, setNotifications] = useState({ highImpact: true, rateDecisions: true, aiAlerts: false, news: true });
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const intervals = ['10s', '30s', '1m', '5m', '15m'];

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500">Configure your MacroAI workspace</p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-200">Appearance</h3>
        <div className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 p-3">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-5 w-5 text-accent-400" /> : <Sun className="h-5 w-5 text-warn-400" />}
            <div>
              <p className="text-sm font-medium text-slate-200">Theme</p>
              <p className="text-xs text-slate-500">Switch between dark and light mode</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="relative h-6 w-11 rounded-full bg-ink-600 transition-colors"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-0.5' : 'left-[22px]'}`} />
          </button>
        </div>
      </div>

      {/* API Configuration */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Key className="h-4 w-4 text-accent-400" /> API Configuration
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Backend API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-accent-500/60"
            />
            <p className="mt-1 text-[11px] text-slate-500">Used to connect to the Python macroeconomic data backend.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">API Endpoint</label>
            <input
              type="text"
              defaultValue="https://api.macroai.io/v1"
              className="w-full rounded-lg border border-ink-700/60 bg-ink-850 px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-accent-500/60"
            />
          </div>
        </div>
      </div>

      {/* Refresh Interval */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <RefreshCw className="h-4 w-4 text-accent-400" /> Refresh Interval
        </h3>
        <div className="flex flex-wrap gap-2">
          {intervals.map((i) => (
            <button
              key={i}
              onClick={() => setRefreshInterval(i)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                refreshInterval === i
                  ? 'border-accent-500/60 bg-accent-500/10 text-accent-300'
                  : 'border-ink-700/60 bg-ink-850 text-slate-400 hover:bg-ink-700'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Bell className="h-4 w-4 text-accent-400" /> Notifications
        </h3>
        <div className="space-y-2.5">
          {[
            { key: 'highImpact', label: 'High Impact Events', desc: 'Alert before high-impact economic releases' },
            { key: 'rateDecisions', label: 'Central Bank Rate Decisions', desc: 'Notify on rate decision announcements' },
            { key: 'aiAlerts', label: 'AI Signal Alerts', desc: 'Get notified when AI changes a currency rating' },
            { key: 'news', label: 'Breaking News', desc: 'Real-time macro and FX news alerts' },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between rounded-lg border border-ink-700/60 bg-ink-850 p-3">
              <div>
                <p className="text-sm font-medium text-slate-200">{n.label}</p>
                <p className="text-xs text-slate-500">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications((s) => ({ ...s, [n.key]: !s[n.key as keyof typeof s] }))}
                className="relative h-6 w-11 rounded-full bg-ink-600 transition-colors"
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full transition-all ${notifications[n.key as keyof typeof notifications] ? 'left-[22px] bg-accent-400' : 'left-0.5 bg-slate-400'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={save}
          className="flex items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-400"
        >
          {saved ? <Check className="h-4 w-4" /> : null}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
