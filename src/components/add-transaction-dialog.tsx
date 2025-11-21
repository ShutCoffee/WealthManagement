'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransaction } from '@/app/actions';
import { PlusCircle } from 'lucide-react';

interface AddTransactionDialogProps {
  assetId: number;
  assetName: string;
  assetSymbol?: string | null;
  onTransactionAdded?: () => void;
}

export function AddTransactionDialog({ 
  assetId, 
  assetName, 
  assetSymbol,
  onTransactionAdded 
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('assetId', assetId.toString());
    formData.set('type', transactionType);

    const result = await createTransaction(formData);
    setIsLoading(false);

    if (result.success) {
      setOpen(false);
      setTransactionType('buy');
      formRef.current?.reset();
      onTransactionAdded?.();
    } else if (result.error) {
      alert(result.error);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setTransactionType('buy');
      formRef.current?.reset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell transaction for {assetName}
          </DialogDescription>
        </DialogHeader>
        
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Transaction Type</Label>
            <Select 
              value={transactionType} 
              onValueChange={(value) => setTransactionType(value as 'buy' | 'sell')}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-date">Date</Label>
            <Input
              id="transaction-date"
              name="date"
              type="date"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-quantity">Quantity (Shares)</Label>
            <Input
              id="transaction-quantity"
              name="quantity"
              type="number"
              step="0.0001"
              placeholder="e.g., 10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-price">Price Per Share</Label>
            <Input
              id="transaction-price"
              name="pricePerShare"
              type="number"
              step="0.01"
              placeholder="e.g., 150.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-notes">Notes (Optional)</Label>
            <Input
              id="transaction-notes"
              name="notes"
              placeholder="e.g., Bought via Robinhood"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

