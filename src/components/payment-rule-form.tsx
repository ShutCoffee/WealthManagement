'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createPaymentRule } from '@/app/actions';
import { Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentRuleFormProps {
  liabilityId: number;
  onSuccess?: () => void;
}

export function PaymentRuleForm({ liabilityId, onSuccess }: PaymentRuleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('liabilityId', liabilityId.toString());
    
    const result = await createPaymentRule(formData);

    setIsLoading(false);

    if (result.success) {
      formRef.current?.reset();
      onSuccess?.();
    } else if (result.error) {
      alert(result.error);
    }
  }

  // Default next execution to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Payment Rule</CardTitle>
        <CardDescription>
          Set up automatic payments to reduce debt balance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Payment Frequency</Label>
            <Select name="frequency" required>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextExecutionDate">Next Payment Date</Label>
            <Input
              id="nextExecutionDate"
              name="nextExecutionDate"
              type="date"
              defaultValue={defaultDate}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="formulaExpression">Payment Formula</Label>
            <Input
              id="formulaExpression"
              name="formulaExpression"
              placeholder="e.g., balance * 0.02 + 50"
              required
            />
            <div className="bg-muted/50 p-3 rounded-lg border text-xs space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Available variables:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li><code className="bg-background px-1 py-0.5 rounded">balance</code> - Current balance</li>
                    <li><code className="bg-background px-1 py-0.5 rounded">interestRate</code> - Interest rate (APR)</li>
                  </ul>
                  <p className="font-medium text-muted-foreground mt-2">Example formulas:</p>
                  <ul className="space-y-0.5 text-muted-foreground">
                    <li><code className="bg-background px-1 py-0.5 rounded">500</code> - Fixed $500 payment</li>
                    <li><code className="bg-background px-1 py-0.5 rounded">balance * 0.02</code> - 2% of balance</li>
                    <li><code className="bg-background px-1 py-0.5 rounded">balance * (interestRate / 100 / 12) + balance * 0.01</code> - Monthly interest + 1% principal</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Rule
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

