package com.capitally.controller;

import com.capitally.model.response.*;
import com.capitally.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
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

    @Operation(summary = "Returns total income and expenses grouped by month and category, based on transaction view.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved total income and expenses grouped by month and category"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/transactions-summary")
    public TransactionsSummaryResponseDTO getTransactionsSummary(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return dashboardService.getTransactionsSummary(userId, startDate, endDate);
    }

    @Operation(summary = "Returns the current balance for each currency, based on all income and expenses.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved the current balance for each currency"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/current-balance")
    public List<CurrentBalanceResponseDTO> getCurrentBalance(@RequestParam BigInteger userId) {
        return dashboardService.getCurrentBalancePerCurrency(userId);
    }


    @Operation(summary = "Returns the cumulative monthly balance trend for each currency between the given dates.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved the cumulative monthly balance trend"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/balance-trend")
    public List<BalanceTrendPerCurrencyResponseDTO> getBalanceTrend(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getBalanceTrendPerCurrency(userId, startDate, endDate);
    }

    @Operation(summary = "Returns total expenses grouped by macro-category and currency for the specified period.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved total expenses grouped by macro-category and currency"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/expense-breakdown")
    public List<ExpenseBreakdownResponseDTO> getExpenseBreakdown(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return dashboardService.getExpenseBreakdown(userId, startDate, endDate);
    }


    @Operation(summary = "Returns upcoming recurring transactions scheduled until the given date.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved upcoming recurring transactions"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/upcoming-recurring")
    public List<UpcomingRecurringTransactionResponseDTO> getUpcomingRecurringTransactions(
            @RequestParam BigInteger userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate untilDate) {
        return dashboardService.getUpcomingRecurringTransactions(userId, untilDate);
    }

    @Operation(summary = "Returns a dashboard overview including balance, income/expense for the current month and upcoming recurring transactions.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved dashboard overview"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/overview")
    public DashboardOverviewResponseDTO getDashboardOverview(@RequestParam BigInteger userId) {
        return dashboardService.getDashboardOverview(userId);
    }
}