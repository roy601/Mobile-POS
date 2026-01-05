"use client";

import { useState, useEffect } from "react";
import { Calendar, Printer, RefreshCw, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/component";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient();

type CashbookEntry = {
  particulars: string;
  debit: number;
  credit: number;
};

type CashbookData = {
  startDate: string;
  endDate: string;
  entries: CashbookEntry[];
  totalDebit: number;
  totalCredit: number;
  cashInHand: number;
};

export function DayCashbook() {
  const { toast } = useToast();

  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [dateFilterEnabled, setDateFilterEnabled] = useState(true);
  const [cashbookData, setCashbookData] = useState<CashbookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Check user authorization (only admin can edit)
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) throw error;

      setIsAuthorized(!!userData?.user);
    } catch (err) {
      console.error("Auth check error:", err);
      setIsAuthorized(false);
    }
  };

  useEffect(() => {
    if (dateFilterEnabled) {
      if (startDate && endDate) {
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
          setError("Start date cannot be after end date");
          return;
        }
        loadCashbookData(startDate, endDate);
      } else if (startDate && !endDate) {
        // Only start date - from that date to today
        loadCashbookData(startDate, today);
      } else if (!startDate && endDate) {
        // Only end date - from beginning to that date
        loadCashbookData("2000-01-01", endDate);
      } else {
        // No dates - show all time
        loadCashbookData("2000-01-01", today);
      }
    }
  }, [startDate, endDate, dateFilterEnabled]);

  // Get the date range description
  const getDateRangeDescription = () => {
    if (!dateFilterEnabled) return "Date filter disabled";
    if (!startDate && !endDate) return "All time";
    if (!startDate && endDate)
      return `All data up to ${new Date(endDate).toLocaleDateString("en-GB")}`;
    if (startDate && !endDate)
      return `From ${new Date(startDate).toLocaleDateString("en-GB")} onwards`;
    return `${new Date(startDate).toLocaleDateString("en-GB")} to ${new Date(
      endDate
    ).toLocaleDateString("en-GB")}`;
  };

  const loadCashbookData = async (start: string, end: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get BFC from the day before start date
      const prevDate = new Date(start);
      prevDate.setDate(prevDate.getDate() - 1);
      const previousDate = prevDate.toISOString().split("T")[0];

      // Initialize default data
      let salesData: {
        totalSalesAmount: number;
        cashAmount: number;
        bankAmount: number;
        duesAmount: number;
      } = {
        totalSalesAmount: 0,
        cashAmount: 0,
        bankAmount: 0,
        duesAmount: 0,
      };
      let purchaseData = { totalAmount: 0, numPurchases: 0 };
      let returnsData = { salesReturns: 0, purchaseReturns: 0 };
      let expensesData: {
        individualExpenses: any[];
      } = {
        individualExpenses: [],
      };
      let incomeData: {
        individualIncomes: any[];
      } = {
        individualIncomes: [],
      };
      let bfcAmount = 0;

      try {
        const results = await Promise.all([
          getSalesData(start, end).catch((err) => {
            console.warn("Sales data error:", err);
            return salesData;
          }),

          getReturnsData(start, end).catch((err) => {
            console.warn("Returns data error:", err);
            return returnsData;
          }),
          getExpensesData(start, end).catch((err) => {
            console.warn("Expenses data error:", err);
            return expensesData;
          }),
          getIncomeData(start, end).catch((err) => {
            console.warn("Income data error:", err);
            return incomeData;
          }),
          getPreviousBalance(previousDate).catch((err) => {
            console.warn("Previous balance error:", err);
            return 0;
          }),
        ]);

        salesData = results[0] || salesData;
        returnsData = results[1] || returnsData;
        expensesData = results[2] || expensesData;
        incomeData = results[3] || incomeData;
        bfcAmount = results[4] || 0;
      } catch (err) {
        console.error("Error loading data:", err);
      }

      // Build entries array
      const entries: CashbookEntry[] = [];

      // Add BFC entry (opening balance)
      entries.push({
        particulars: "BFC (Brought Forward Cash)",
        debit: bfcAmount >= 0 ? bfcAmount : 0,
        credit: bfcAmount < 0 ? Math.abs(bfcAmount) : 0,
      });

      // Cash Sales (actual cash received, money IN)
      if (salesData.totalSalesAmount > 0) {
        entries.push({
          particulars: "Cash Sales",
          debit: salesData.totalSalesAmount,
          credit: 0,
        });
      }

      // UPDATED: Bank/Digital Payments (money goes to bank, not cash in hand - CREDIT)
      if (salesData.bankAmount > 0) {
        entries.push({
          particulars: "Bank/Digital Payments",
          debit: 0,
          credit: salesData.bankAmount,
        });
      }

      // Purchase Returns (money/credit coming back from suppliers)
      if (returnsData.purchaseReturns > 0) {
        entries.push({
          particulars: "Purchase Returns",
          debit: returnsData.purchaseReturns,
          credit: 0,
        });
      }

      // Add individual income transactions
      if (
        incomeData.individualIncomes &&
        incomeData.individualIncomes.length > 0
      ) {
        incomeData.individualIncomes.forEach((income: any) => {
          const incomeTypeLabel =
            income.income_type === "owner_income"
              ? "Owner Income"
              : "Party Income";
          const destinationLabel =
            income.destination_type === "bank" ? "Bank" : "Cash";
          const description = income.description
            ? ` - ${income.description}`
            : "";

          entries.push({
            particulars: `${incomeTypeLabel} (${destinationLabel})${description}`,
            debit: income.amount || 0,
            credit: 0,
          });
        });
      }

      // Sales Returns (refunds paid to customers)
      if (returnsData.salesReturns > 0) {
        entries.push({
          particulars: "Sales Returns (Refunds)",
          debit: 0,
          credit: returnsData.salesReturns,
        });
      }

      // Add individual expense transactions
      if (
        expensesData.individualExpenses &&
        expensesData.individualExpenses.length > 0
      ) {
        expensesData.individualExpenses.forEach((expense: any) => {
          const category =
            expense.custom_category || expense.category || "Other";
          entries.push({
            particulars: `${category} - ${expense.description}`,
            debit: 0,
            credit: expense.amount || 0,
          });
        });
      }

      // Calculate totals
      const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
      const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
      const cashInHand = totalDebit - totalCredit;

      const data: CashbookData = {
        startDate: start,
        endDate: end,
        entries: entries,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        cashInHand: cashInHand,
      };

      setCashbookData(data);
    } catch (err: any) {
      console.error("Error loading cashbook data:", err);
      setError(err.message || "Failed to load cashbook data");
      toast({
        title: "Error",
        description: "Failed to load cashbook data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSalesData = async (start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          id, 
          total_amount, 
          cash_received, 
          card_received, 
          bank_transfer_received, 
          bkash_received, 
          nagad_received, 
          rocket_received, 
          upay_received, 
          due_amount, 
          invoice_number
        `
        )
        .gte("created_at", start)
        .lte("created_at", `${end}T23:59:59.999Z`)
        .eq("status", "completed");

      if (error) {
        console.error("Sales data error:", error);
        throw error;
      }

      const sales = data || [];

      const totals = sales.reduce(
        (acc, sale) => {
          const totalAmount = sale.total_amount || 0;
          const cashAmount = sale.cash_received || 0;
          const bankAmount =
            (sale.card_received || 0) +
            (sale.bank_transfer_received || 0) +
            (sale.bkash_received || 0) +
            (sale.nagad_received || 0) +
            (sale.rocket_received || 0) +
            (sale.upay_received || 0);
          const duesAmount = sale.due_amount || 0;

          return {
            totalSalesAmount: acc.totalSalesAmount + totalAmount,
            cashAmount: acc.cashAmount + cashAmount,
            bankAmount: acc.bankAmount + bankAmount,
            duesAmount: acc.duesAmount + duesAmount,
          };
        },
        { totalSalesAmount: 0, cashAmount: 0, bankAmount: 0, duesAmount: 0 }
      );

      return totals;
    } catch (error) {
      console.error("getSalesData error:", error);
      return {
        totalSalesAmount: 0,
        cashAmount: 0,
        bankAmount: 0,
        duesAmount: 0,
      };
    }
  };

  // const getPurchaseData = async (start: string, end: string) => {
  //   try {
  //     const { data, error } = await supabase
  //       .from("purchases")
  //       .select(`
  //         id,
  //         cost_price,
  //         color_variants(purchase_id)
  //       `)
  //       .gte("created_at", start)
  //       .lte("created_at", `${end}T23:59:59.999Z`)

  //     if (error) {
  //       console.error("Purchase data error:", error)
  //       return { totalAmount: 0, numPurchases: 0 }
  //     }

  //     // Count total color_variants (products)
  //     let numPurchases = data.flatMap(p => p.color_variants ?? []).length

  //     // Calculate total amount: cost_price × number of variants for each purchase
  //     const totalAmount = data.reduce((sum, purchase) => {
  //       const numVariants = purchase.color_variants?.length ?? 0
  //       const costPrice = purchase.cost_price ?? 0
  //       return sum + (costPrice * numVariants)
  //     }, 0)

  //     return { totalAmount, numPurchases }
  //   } catch (error) {
  //     console.error("getPurchaseData error:", error)
  //     return { totalAmount: 0, numPurchases: 0 }
  //   }
  // }

  const getReturnsData = async (start: string, end: string) => {
    try {
      const [salesReturnsResult, purchaseReturnsResult] = await Promise.all([
        supabase
          .from("sales_returns")
          .select("total_refund_amount")
          .gte("return_date", start)
          .lte("return_date", `${end}T23:59:59.999Z`)
          .eq("status", "processed")
          .then((result) => (result.error ? { data: [] } : result)),
        supabase
          .from("purchase_returns")
          .select("total_credit_amount")
          .gte("return_date", start)
          .lte("return_date", end)
          .eq("status", "processed")
          .then((result) => (result.error ? { data: [] } : result)),
      ]);

      const salesReturns = (salesReturnsResult.data || []).reduce(
        (sum, ret) => sum + (ret.total_refund_amount || 0),
        0
      );

      const purchaseReturns = (purchaseReturnsResult.data || []).reduce(
        (sum, ret) => sum + (ret.total_credit_amount || 0),
        0
      );

      return {
        salesReturns,
        purchaseReturns,
      };
    } catch (error) {
      console.error("getReturnsData error:", error);
      return { salesReturns: 0, purchaseReturns: 0 };
    }
  };

  const getExpensesData = async (start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          "id, amount, category, custom_category, description, created_at"
        )
        .gte("date", start)
        .lte("date", end)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Expenses data error:", error);
        return { individualExpenses: [] };
      }

      const expenses = data || [];

      const individualExpenses = expenses.map((expense) => ({
        id: expense.id,
        amount: expense.amount || 0,
        category: expense.category || "Other",
        custom_category: expense.custom_category,
        description: expense.description || "No description",
        created_at: expense.created_at,
      }));

      return { individualExpenses };
    } catch (error) {
      console.error("getExpensesData error:", error);
      return { individualExpenses: [] };
    }
  };

  const getIncomeData = async (start: string, end: string) => {
    try {
      const { data, error } = await supabase
        .from("income_owner")
        .select(
          "id, amount, income_type, destination_type, description, created_at"
        )
        .gte("date", start)
        .lte("date", end)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Income data error:", error);
        return { individualIncomes: [] };
      }

      const incomes = data || [];

      const individualIncomes = incomes.map((income) => ({
        id: income.id,
        amount: income.amount || 0,
        income_type: income.income_type || "owner_income",
        destination_type: income.destination_type || "cash",
        description: income.description || "",
        created_at: income.created_at,
      }));

      return { individualIncomes };
    } catch (error) {
      console.error("getIncomeData error:", error);
      return { individualIncomes: [] };
    }
  };

  const getPreviousBalance = async (date: string) => {
    try {
      // Get all data up to and including the previous date
      const [salesResult, returnsResult, expensesResult, incomeResult] =
        await Promise.all([
          getSalesData("2000-01-01", date),
          getReturnsData("2000-01-01", date),
          getExpensesData("2000-01-01", date),
          getIncomeData("2000-01-01", date),
        ]);

      // Calculate total income amount
      const totalIncome = incomeResult.individualIncomes.reduce(
        (sum, income) => sum + income.amount,
        0
      );

      // UPDATED: Calculate total debits (money in) - now EXCLUDING bankAmount
      const totalDebits =
        salesResult.cashAmount + returnsResult.purchaseReturns + totalIncome;

      // UPDATED: Calculate total credits (money out) - now INCLUDING bankAmount
      const totalCredits =
        returnsResult.salesReturns +
        expensesResult.individualExpenses.reduce(
          (sum, exp) => sum + exp.amount,
          0
        ) +
        salesResult.duesAmount; // Bank payments reduce cash in hand

      // Cash in hand = Dr - Cr
      const balance = totalDebits - totalCredits;

      return balance;
    } catch (error) {
      console.error("getPreviousBalance error:", error);
      return 0;
    }
  };

  const handlePrint = () => {
    if (!cashbookData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = () => {
    if (!cashbookData) return "";

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatAmount = (amount: number) => amount.toFixed(2);

    const dateRangeText = getDateRangeDescription();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cash Book - ${dateRangeText}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 15px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px;
          }
          .company-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .address { 
            font-size: 10px; 
            margin-bottom: 10px; 
          }
          .period {
            font-size: 11px;
            margin-bottom: 10px;
          }
          .title {
            border: 2px solid black;
            border-radius: 20px;
            padding: 5px 20px;
            display: inline-block;
            font-size: 14px;
            font-weight: bold;
          }
          .cashbook-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            border: 2px solid black;
          }
          .cashbook-table th, 
          .cashbook-table td { 
            border: 1px solid black; 
            padding: 6px; 
            text-align: left; 
            font-size: 11px;
          }
          .cashbook-table th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
            text-align: center;
          }
          .amount-cell { 
            text-align: right; 
            font-family: monospace;
          }
          .total-row { 
            font-weight: bold; 
            background-color: #f0f0f0;
            border-top: 2px solid black;
          }
          .cash-in-hand {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
          }
          @media print {
            body { margin: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">STAR POWER</div>
          <div class="address">
            Shop#507/B(5th Floor) Sector-7 Road No-3,North Tower Uttara,Dhaka - 1230,Bangladesh-868/955.0
          </div>
          <div class="period">${dateRangeText}</div>
          <div class="title">CASH BOOK</div>
        </div>

        <table class="cashbook-table">
          <thead>
            <tr>
              <th style="width: 50%;">Particulars</th>
              <th style="width: 25%;">Dr.</th>
              <th style="width: 25%;">Cr.</th>
            </tr>
          </thead>
          <tbody>
            ${(cashbookData.entries || [])
              .map(
                (entry) => `
              <tr>
                <td>${entry.particulars}</td>
                <td class="amount-cell">${
                  entry.debit > 0 ? formatAmount(entry.debit) : ""
                }</td>
                <td class="amount-cell">${
                  entry.credit > 0 ? formatAmount(entry.credit) : ""
                }</td>
              </tr>
            `
              )
              .join("")}
            <tr class="total-row">
              <td></td>
              <td class="amount-cell">${formatAmount(
                cashbookData.totalDebit || 0
              )}</td>
              <td class="amount-cell">${formatAmount(
                cashbookData.totalCredit || 0
              )}</td>
            </tr>
          </tbody>
        </table>

        <div class="cash-in-hand">
          Cash In Hand &nbsp;&nbsp;&nbsp;&nbsp; ${formatAmount(
            cashbookData.cashInHand || 0
          )}
        </div>
      </body>
      </html>
    `;
  };

  const formatCurrency = (amount: number) => amount.toFixed(2);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cash Book</h1>
        <div className="flex items-center gap-2">
          {!isAuthorized && (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
              <Lock className="h-4 w-4 mr-2" />
              Read Only
            </div>
          )}
          <Button
            variant="outline"
            onClick={() =>
              dateFilterEnabled &&
              loadCashbookData(startDate || "2000-01-01", endDate || today)
            }
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button onClick={handlePrint} disabled={!cashbookData}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Date Range Selection - UPDATED with flexible dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-date-filter"
                checked={dateFilterEnabled}
                onChange={(e) => setDateFilterEnabled(e.target.checked)}
                className="h-4 w-4"
                title="Enable date filter"
              />
              <Label htmlFor="enable-date-filter" className="cursor-pointer">
                Enable Date Filter
              </Label>
            </div>

            {dateFilterEnabled && (
              <>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <Label htmlFor="start-date">From Date (optional)</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">To Date (optional)</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-48"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate(today);
                      setEndDate(today);
                    }}
                    className="mt-6"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="mt-6"
                  >
                    Clear Dates
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>Showing: </strong>
                  {getDateRangeDescription()}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="text-red-600 font-medium">Error: {error}</div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading cashbook data...</p>
          </CardContent>
        </Card>
      )}

      {/* Main Cashbook */}
      {cashbookData && !loading && (
        <Card>
          <CardHeader className="text-center">
            <div className="space-y-2">
              <div className="text-xl font-bold">STAR POWER</div>
              <div className="text-xs text-muted-foreground">
                Shop#507/B(5th Floor) Sector-7 Road No-3,North Tower
                Uttara,Dhaka - 1230,Bangladesh-868/955.0
              </div>
              <div className="text-sm">{getDateRangeDescription()}</div>
              <div className="inline-block border-2 border-black rounded-full px-6 py-1 font-bold">
                CASH BOOK
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table
                className="w-full border-2 border-black"
                style={{ borderCollapse: "collapse" }}
              >
                <thead>
                  <tr className="bg-gray-100">
                    <th
                      className="border border-black px-3 py-2 text-center font-bold"
                      style={{ width: "50%" }}
                    >
                      Particulars
                    </th>
                    <th
                      className="border border-black px-3 py-2 text-center font-bold"
                      style={{ width: "25%" }}
                    >
                      Dr.
                    </th>
                    <th
                      className="border border-black px-3 py-2 text-center font-bold"
                      style={{ width: "25%" }}
                    >
                      Cr.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(cashbookData?.entries || []).map((entry, index) => (
                    <tr key={index}>
                      <td className="border border-black px-3 py-1 text-sm">
                        {entry.particulars}
                      </td>
                      <td className="border border-black px-3 py-1 text-right text-sm font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : ""}
                      </td>
                      <td className="border border-black px-3 py-1 text-right text-sm font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : ""}
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-black">
                    <td className="border border-black px-3 py-2"></td>
                    <td className="border border-black px-3 py-2 text-right font-mono">
                      {formatCurrency(cashbookData?.totalDebit || 0)}
                    </td>
                    <td className="border border-black px-3 py-2 text-right font-mono">
                      {formatCurrency(cashbookData?.totalCredit || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cash In Hand */}
            <div className="text-center mt-8 text-xl font-bold">
              Cash In Hand &nbsp;&nbsp;&nbsp;&nbsp;{" "}
              {formatCurrency(cashbookData?.cashInHand || 0)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
