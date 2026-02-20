import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  description: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  accessRights: string[];
}

interface DemoCredentialsProps {
  accounts: DemoAccount[];
  onSelect: (email: string, password: string) => void;
}

const badgeColors: Record<string, string> = {
  Admin: 'bg-red-100 text-red-700 border-red-200',
  'Super Admin': 'bg-purple-100 text-purple-700 border-purple-200',
  Student: 'bg-blue-100 text-blue-700 border-blue-200',
  Customer: 'bg-blue-100 text-blue-700 border-blue-200',
  'Host (Vendor)': 'bg-green-100 text-green-700 border-green-200',
  'Host Employee': 'bg-orange-100 text-orange-700 border-orange-200',
  'Laundry Agent': 'bg-teal-100 text-teal-700 border-teal-200',
};

const DemoCredentials: React.FC<DemoCredentialsProps> = ({ accounts, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const handleUse = (account: DemoAccount) => {
    onSelect(account.email, account.password);
    setSelectedLabel(account.label);
    toast({
      title: '✅ Demo credentials applied',
      description: `${account.label} credentials filled — click Login to continue`,
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span>Demo Accounts — Quick Access</span>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Click "Use" to auto-fill credentials, then press Login.
          </p>

          {accounts.map((account) => (
            <div
              key={account.label}
              className={`rounded-md border bg-background p-3 transition-all ${
                selectedLabel === account.label ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        badgeColors[account.label] || 'bg-secondary text-secondary-foreground border-border'
                      }`}
                    >
                      {account.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{account.description}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedLabel === account.label ? 'default' : 'outline'}
                  className="shrink-0 h-7 text-xs"
                  onClick={() => handleUse(account)}
                >
                  {selectedLabel === account.label ? '✓ Applied' : 'Use'}
                </Button>
              </div>

              {/* Access Rights */}
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Access</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {account.accessRights.map((right) => (
                    <span
                      key={right}
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground"
                    >
                      {right}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DemoCredentials;
