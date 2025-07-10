package com.capitally.service;

import com.capitally.core.entity.AccountEntity;
import com.capitally.core.entity.TransactionEntity;
import com.capitally.core.entity.view.MonthlyTransactionReportView;
import com.capitally.core.enums.CategoryTypeEnum;
import com.capitally.core.repository.AccountRepository;
import com.capitally.core.repository.MonthlyTransactionReportViewRepository;
import com.capitally.core.repository.TransactionRepository;
import com.capitally.model.MonthlyTotalDTO;
import com.capitally.model.response.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final MonthlyTransactionReportViewRepository reportRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public TransactionsSummaryResponseDTO getTransactionsSummary(BigInteger userId, LocalDate startDate, LocalDate endDate) {
        String startMonth = startDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
        String endMonth = endDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        List<MonthlyTransactionReportView> reports = reportRepository
                .findByIdUserIdAndIdMonthBetween(userId, startMonth, endMonth);

        List<MonthlyTotalDTO> income = reports.stream()
                .filter(r -> "Income".equalsIgnoreCase(r.getId().getCategoryType()))
                .map(r -> new MonthlyTotalDTO(r.getId().getMonth(), r.getTotal()))
                .toList();

        List<MonthlyTotalDTO> expenses = reports.stream()
                .filter(r -> "Expense".equalsIgnoreCase(r.getId().getCategoryType()))
                .map(r -> new MonthlyTotalDTO(r.getId().getMonth(), r.getTotal()))
                .toList();

        return new TransactionsSummaryResponseDTO(income, expenses);
    }

    public List<CurrentBalanceResponseDTO> getCurrentBalancePerCurrency(BigInteger userId) {
        List<AccountEntity> userAccounts = accountRepository.findByUserId(userId);

        Map<String, BigDecimal> balancePerCurrency = new HashMap<>();

        for (AccountEntity account : userAccounts) {
            String currency = account.getCurrency().getCode();
            BigDecimal initialBalance = Optional.ofNullable(account.getInitialBalance()).orElse(BigDecimal.ZERO);

            BigDecimal transactionSum = transactionRepository.findAllByAccountId(account.getId()).stream()
                    .map(transaction -> {
                        BigDecimal amount = transaction.getAmount();
                        CategoryTypeEnum categoryType = transaction.getCategory().getCategoryType();
                        return CategoryTypeEnum.EXPENSE.equals(categoryType) ? amount.negate() : amount;
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal accountBalance = initialBalance.add(transactionSum);

            balancePerCurrency.merge(currency, accountBalance, BigDecimal::add);
        }

        return balancePerCurrency.entrySet().stream()
                .map(entry -> new CurrentBalanceResponseDTO(entry.getKey(), entry.getValue()))
                .toList();
    }

    public List<BalanceTrendPerCurrencyResponseDTO> getBalanceTrendPerCurrency(BigInteger userId, LocalDate startDate, LocalDate endDate) {
        List<AccountEntity> userAccounts = accountRepository.findByUserId(userId);

        Map<String, Map<String, BigDecimal>> monthlyCurrencyMovements = new TreeMap<>();

        for (AccountEntity account : userAccounts) {
            String currency = account.getCurrency().getCode();
            BigDecimal initialBalance = Optional.ofNullable(account.getInitialBalance()).orElse(BigDecimal.ZERO);
            LocalDate createdAt = Optional.ofNullable(account.getCreatedAt()).map(LocalDateTime::toLocalDate).orElse(startDate);
            String creationMonth = YearMonth.from(createdAt).toString();

            monthlyCurrencyMovements
                    .computeIfAbsent(creationMonth, m -> new HashMap<>())
                    .merge(currency, initialBalance, BigDecimal::add);

            List<TransactionEntity> transactions = transactionRepository.findAllByAccountId(account.getId());

            for (TransactionEntity t : transactions) {
                LocalDate date = t.getDate();
                if (date == null || date.isBefore(startDate) || date.isAfter(endDate)) continue;

                String month = YearMonth.from(date).toString();
                BigDecimal signedAmount = CategoryTypeEnum.EXPENSE.equals(t.getCategory().getCategoryType())
                        ? t.getAmount().negate()
                        : t.getAmount();

                monthlyCurrencyMovements
                        .computeIfAbsent(month, m -> new HashMap<>())
                        .merge(currency, signedAmount, BigDecimal::add);
            }
        }

        LocalDate today = LocalDate.now();
        LocalDate maxEnd = endDate.isAfter(today) ? today : endDate;
        List<String> allMonths = getAllMonthsBetween(startDate, maxEnd);

        Set<String> allCurrencies = userAccounts.stream()
                .map(a -> a.getCurrency().getCode())
                .collect(Collectors.toSet());

        Map<String, BigDecimal> runningPerCurrency = new HashMap<>();
        List<BalanceTrendPerCurrencyResponseDTO> result = new ArrayList<>();

        for (String month : allMonths) {
            Map<String, BigDecimal> currentMovements = monthlyCurrencyMovements.getOrDefault(month, Collections.emptyMap());

            for (String currency : allCurrencies) {
                BigDecimal movement = currentMovements.getOrDefault(currency, BigDecimal.ZERO);
                BigDecimal updated = runningPerCurrency.getOrDefault(currency, BigDecimal.ZERO).add(movement);
                runningPerCurrency.put(currency, updated);
                result.add(new BalanceTrendPerCurrencyResponseDTO(month, currency, updated));
            }
        }

        return result;
    }

    private List<String> getAllMonthsBetween(LocalDate start, LocalDate end) {
        List<String> months = new ArrayList<>();
        YearMonth current = YearMonth.from(start);
        YearMonth endMonth = YearMonth.from(end);

        while (!current.isAfter(endMonth)) {
            months.add(current.toString());
            current = current.plusMonths(1);
        }

        return months;
    }

    public List<ExpenseBreakdownResponseDTO> getExpenseBreakdown(BigInteger userId, LocalDate startDate, LocalDate endDate) {
        List<TransactionEntity> transactions = transactionRepository.findByUserIdAndDateBetween(userId, startDate, endDate);

        Map<String, Map<String, BigDecimal>> totals = new HashMap<>();

        for (TransactionEntity t : transactions) {
            if (t.getCategory() == null || t.getCategory().getCategoryType() != CategoryTypeEnum.EXPENSE) continue;

            String macro = t.getCategory().getMacroCategory();
            String currency = t.getCurrency().getCode();
            BigDecimal amount = Optional.ofNullable(t.getAmount()).orElse(BigDecimal.ZERO);

            totals
                    .computeIfAbsent(macro, m -> new HashMap<>())
                    .merge(currency, amount, BigDecimal::add);
        }

        List<ExpenseBreakdownResponseDTO> result = new ArrayList<>();
        for (Map.Entry<String, Map<String, BigDecimal>> entry : totals.entrySet()) {
            String macroCategory = entry.getKey();
            for (Map.Entry<String, BigDecimal> inner : entry.getValue().entrySet()) {
                result.add(new ExpenseBreakdownResponseDTO(macroCategory, inner.getKey(), inner.getValue()));
            }
        }

        return result;
    }

    public List<UpcomingRecurringTransactionResponseDTO> getUpcomingRecurringTransactions(BigInteger userId, LocalDate untilDate) {
        List<TransactionEntity> recurring = transactionRepository.findByUserIdAndIsRecurringTrue(userId);
        LocalDate today = LocalDate.now();

        return recurring.stream()
                .filter(tx -> tx.getDate() != null && !tx.getDate().isAfter(untilDate))
                .filter(tx -> tx.getRecurrenceInterval() != null && tx.getRecurrencePeriod() != null)
                .flatMap(tx -> {
                    List<UpcomingRecurringTransactionResponseDTO> occurrences = new ArrayList<>();
                    LocalDate next = tx.getDate();
                    TemporalUnit unit = switch (tx.getRecurrencePeriod().toUpperCase()) {
                        case "DAYS" -> ChronoUnit.DAYS;
                        case "WEEKS" -> ChronoUnit.WEEKS;
                        case "MONTHS" -> ChronoUnit.MONTHS;
                        default -> null;
                    };
                    if (unit == null) return Stream.empty();

                    LocalDate end = Optional.ofNullable(tx.getRecurrenceEndDate())
                            .filter(d -> d.isBefore(untilDate))
                            .orElse(untilDate);

                    while (!next.isAfter(end)) {
                        if (!next.isBefore(today)) {
                            occurrences.add(new UpcomingRecurringTransactionResponseDTO(
                                    tx.getDescription(),
                                    tx.getAmount(),
                                    tx.getCurrency().getCode(),
                                    next,
                                    tx.getRecurrencePeriod(),
                                    tx.getRecurrenceInterval().intValue(),
                                    tx.getCategory().getCategory(),
                                    tx.getAccount().getName()
                            ));
                        }
                        next = next.plus(tx.getRecurrenceInterval().longValue(), unit);
                    }

                    return occurrences.stream();
                })
                .toList();
    }

}
