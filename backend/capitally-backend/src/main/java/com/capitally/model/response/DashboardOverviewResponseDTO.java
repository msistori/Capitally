package com.capitally.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
@AllArgsConstructor
public class DashboardOverviewResponseDTO {
    private Map<String, BigDecimal> totalBalancePerCurrency;
    private Map<String, BigDecimal>  totalIncomeThisMonth;
    private Map<String, BigDecimal>  totalExpenseThisMonth;
    private int upcomingRecurringCount;
}