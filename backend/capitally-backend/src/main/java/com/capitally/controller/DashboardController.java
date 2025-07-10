package com.capitally.controller;

import com.capitally.model.response.*;
import com.capitally.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/transactions-summary")
    @Operation(summary = "Returns total income and expenses grouped by month and category, based on transaction view.")
    public TransactionsSummaryResponseDTO getTransactionsSummary(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return dashboardService.getTransactionsSummary(userId, startDate, endDate);
    }

    @GetMapping("/current-balance")
    @Operation(summary = "Returns the current balance for each currency, based on all income and expenses.")
    public List<CurrentBalanceResponseDTO> getCurrentBalance(@RequestParam BigInteger userId) {
        return dashboardService.getCurrentBalancePerCurrency(userId);
    }

    @GetMapping("/balance-trend")
    @Operation(summary = "Returns the cumulative monthly balance trend for each currency between the given dates.")
    public List<BalanceTrendPerCurrencyResponseDTO> getBalanceTrend(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getBalanceTrendPerCurrency(userId, startDate, endDate);
    }

    @GetMapping("/expense-breakdown")
    @Operation(summary = "Returns total expenses grouped by macro-category and currency for the specified period.")
    public List<ExpenseBreakdownResponseDTO> getExpenseBreakdown(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getExpenseBreakdown(userId, startDate, endDate);
    }

    @GetMapping("/upcoming-recurring")
    @Operation(summary = "Returns upcoming recurring transactions scheduled until the given date.")
    public List<UpcomingRecurringTransactionResponseDTO> getUpcomingRecurringTransactions(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate untilDate) {
        return dashboardService.getUpcomingRecurringTransactions(userId, untilDate);
    }
}