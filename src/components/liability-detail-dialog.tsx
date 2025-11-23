'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getLiabilityPayments, 
  calculateLiabilityMetricsAction, 
  getPaymentRules,
  recordManualPayment,
  deletePaymentRule,
  updatePaymentRule,
} from '@/app/actions'
import { PaymentRuleForm } from '@/components/payment-rule-form';
import { Trash2, Calendar, DollarSign, Percent, TrendingDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LiabilityPayment, LiabilityPaymentRule } from '@/db/schema';

interface LiabilityDetailDialogProps {
  liabilityId: number;
  liabilityName: string;
  currency: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface LiabilityMetrics {
  currentBalance: number;
  interestRate: number;
  totalPaid: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  ytdInterestPaid: number;
  ytdPrincipalPaid: number;
  paymentCount: number;
}

export function LiabilityDetailDialog({ 
  liabilityId, 
  liabilityName, 
  currency,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: LiabilityDetailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [payments, setPayments] = useState<LiabilityPayment[]>([]);
  const [metrics, setMetrics] = useState<LiabilityMetrics | null>(null);
  const [paymentRules, setPaymentRules] = useState<LiabilityPaymentRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const manualPaymentFormRef = useRef<HTMLFormElement>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, liabilityId]);

  async function loadData() {
    setIsLoading(true);
    
    const [paymentsData, metricsData, rulesData] = await Promise.all([
      getLiabilityPayments(liabilityId),
      calculateLiabilityMetricsAction(liabilityId),
      getPaymentRules(liabilityId),
    ]);
    
    setPayments(paymentsData);
    if (!('error' in metricsData)) {
      setMetrics(metricsData);
    }
    setPaymentRules(rulesData);
    
    setIsLoading(false);
  }

  async function handleManualPaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmittingPayment(true);

    const formData = new FormData(e.currentTarget);
    formData.set('liabilityId', liabilityId.toString());
    
    const result = await recordManualPayment(formData);

    setIsSubmittingPayment(false);

    if (result.success) {
      setShowManualPaymentForm(false);
      manualPaymentFormRef.current?.reset();
      loadData();
    } else if (result.error) {
      alert(result.error);
    }
  }

  async function handleDeleteRule(ruleId: number) {
    if (!confirm('Are you sure you want to delete this payment rule?')) {
      return;
    }

    const result = await deletePaymentRule(ruleId);
    if (result.success) {
      loadData();
    } else if (result.error) {
      alert(result.error);
    }
  }

  async function handleToggleRule(ruleId: number, currentEnabled: boolean) {
    const result = await updatePaymentRule(ruleId, { enabled: !currentEnabled });
    if (result.success) {
      loadData();
    } else if (result.error) {
      alert(result.error);
    }
  }

  const defaultDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{liabilityName}</DialogTitle>
          <DialogDescription>
            Manage payments and track liability reduction
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="rules">Payment Rules</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {metrics && (
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold mb-3">Liability Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Current Balance</div>
                        <div className="font-semibold text-lg text-rose-600 dark:text-rose-500">
                          {currency} {metrics.currentBalance.toFixed(2)}
                        </div>
                      </div>
                      {metrics.interestRate > 0 && (
                        <div>
                          <div className="text-muted-foreground flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            Interest Rate (APR)
                          </div>
                          <div className="font-medium">{metrics.interestRate.toFixed(2)}%</div>
                        </div>
                      )}
                      <div>
                        <div className="text-muted-foreground">Total Paid</div>
                        <div className="font-medium text-emerald-600 dark:text-emerald-500">
                          {currency} {metrics.totalPaid.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Principal Paid</div>
                        <div className="font-medium">
                          {currency} {metrics.totalPrincipalPaid.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Interest Paid (Total)</div>
                        <div className="font-medium text-amber-600 dark:text-amber-500">
                          {currency} {metrics.totalInterestPaid.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Interest Paid (YTD)</div>
                        <div className="font-medium text-amber-600 dark:text-amber-500">
                          {currency} {metrics.ytdInterestPaid.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground">Payment Count</div>
                        <div className="font-medium">{metrics.paymentCount}</div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Payment History</h3>
                    {!showManualPaymentForm && (
                      <Button onClick={() => setShowManualPaymentForm(true)}>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Record Payment
                      </Button>
                    )}
                  </div>

                  {showManualPaymentForm && (
                    <Card className="mb-4">
                      <CardHeader>
                        <CardTitle>Record Manual Payment</CardTitle>
                        <CardDescription>Add a payment you made to this liability</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form ref={manualPaymentFormRef} onSubmit={handleManualPaymentSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="payment-amount">Payment Amount</Label>
                              <Input
                                id="payment-amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                autoFocus
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="payment-date">Payment Date</Label>
                              <Input
                                id="payment-date"
                                name="date"
                                type="date"
                                defaultValue={defaultDate}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment-notes">Notes (Optional)</Label>
                            <Input
                              id="payment-notes"
                              name="notes"
                              placeholder="Additional notes..."
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowManualPaymentForm(false);
                                manualPaymentFormRef.current?.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmittingPayment}>
                              {isSubmittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Record Payment
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground rounded-lg border">
                      No payments recorded yet.
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Date</th>
                              <th className="text-left p-3 text-sm font-medium">Type</th>
                              <th className="text-right p-3 text-sm font-medium">Amount</th>
                              <th className="text-right p-3 text-sm font-medium">Principal</th>
                              <th className="text-right p-3 text-sm font-medium">Interest</th>
                              <th className="text-left p-3 text-sm font-medium">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {payments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-muted/30">
                                <td className="p-3 text-sm">
                                  {new Date(payment.date).toLocaleDateString()}
                                </td>
                                <td className="p-3 text-sm">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    payment.type === 'automatic' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}>
                                    {payment.type}
                                  </span>
                                </td>
                                <td className="p-3 text-sm text-right font-medium text-emerald-600 dark:text-emerald-500">
                                  {currency} {parseFloat(payment.amount).toFixed(2)}
                                </td>
                                <td className="p-3 text-sm text-right">
                                  {payment.principalPortion 
                                    ? `${currency} ${parseFloat(payment.principalPortion).toFixed(2)}`
                                    : '-'}
                                </td>
                                <td className="p-3 text-sm text-right text-amber-600 dark:text-amber-500">
                                  {payment.interestPortion 
                                    ? `${currency} ${parseFloat(payment.interestPortion).toFixed(2)}`
                                    : '-'}
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">
                                  {payment.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Payment Rules Tab */}
              <TabsContent value="rules" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Active Payment Rules</h3>
                  
                  {paymentRules.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground rounded-lg border mb-4">
                      No payment rules configured yet.
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6">
                      {paymentRules.map((rule) => (
                        <Card key={rule.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    rule.enabled 
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}>
                                    {rule.enabled ? (
                                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                                    ) : (
                                      <><XCircle className="h-3 w-3 mr-1" /> Disabled</>
                                    )}
                                  </span>
                                  <span className="text-sm font-medium capitalize">{rule.frequency}</span>
                                </div>
                                <div className="font-mono text-sm bg-muted/50 p-2 rounded mb-2">
                                  {rule.formulaExpression}
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Next execution: {new Date(rule.nextExecutionDate).toLocaleDateString()}
                                  </div>
                                  {rule.lastExecutionDate && (
                                    <div>
                                      Last executed: {new Date(rule.lastExecutionDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleRule(rule.id, rule.enabled)}
                                >
                                  {rule.enabled ? 'Disable' : 'Enable'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteRule(rule.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <PaymentRuleForm liabilityId={liabilityId} onSuccess={loadData} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

