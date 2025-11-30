"use client";

import { Card, Badge } from "@mantine/core";
import { Receipt, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  tierName: string;
  weeksPurchased: number;
  amount: number;
  status: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" variant="light" size="xs">Completed</Badge>;
      case 'pending':
        return <Badge color="yellow" variant="light" size="xs">Pending</Badge>;
      case 'failed':
        return <Badge color="red" variant="light" size="xs">Failed</Badge>;
      case 'refunded':
        return <Badge color="gray" variant="light" size="xs">Refunded</Badge>;
      default:
        return <Badge color="gray" variant="light" size="xs">{status}</Badge>;
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="rounded-xl" padding="lg">
        <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-muted mb-3">
            <Receipt className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No transactions yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your purchase history will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl" padding="lg">
      <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            {/* Left: Icon + Details */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <CreditCard className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{transaction.tierName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.date)} • {transaction.weeksPurchased} week{transaction.weeksPurchased > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Right: Amount + Status */}
            <div className="flex items-center gap-3">
              <span className={cn(
                "text-sm font-semibold",
                transaction.status === 'refunded' && "text-muted-foreground line-through"
              )}>
                {formatAmount(transaction.amount)}
              </span>
              {getStatusBadge(transaction.status)}
            </div>
          </div>
        ))}
      </div>

      {transactions.length >= 10 && (
        <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
          Showing last 10 transactions
        </p>
      )}
    </Card>
  );
}
