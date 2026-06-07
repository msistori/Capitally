package com.capitally.app.service;

import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DemoDataRefreshService {
    private final TransactionRepository transactionRepository;

    @Transactional
    public void refreshIfNeeded(UserEntity user) {
        List<TransactionEntity> transactions = transactionRepository.findByUser_Id(user.getId());
        if (transactions.isEmpty()) {
            return;
        }

        YearMonth currentMonth = YearMonth.now();
        YearMonth latestTransactionMonth = transactions.stream()
                .map(TransactionEntity::getDate)
                .filter(date -> date != null)
                .max(Comparator.naturalOrder())
                .map(YearMonth::from)
                .orElse(null);

        if (latestTransactionMonth == null || !latestTransactionMonth.isBefore(currentMonth)) {
            return;
        }

        int monthsToShift = (int) latestTransactionMonth.until(currentMonth, ChronoUnit.MONTHS);
        transactions.forEach(transaction -> {
            transaction.setDate(shiftDate(transaction.getDate(), monthsToShift));
            transaction.setRecurrenceEndDate(shiftDate(transaction.getRecurrenceEndDate(), monthsToShift));
        });

        transactionRepository.saveAll(transactions);
    }

    private LocalDate shiftDate(LocalDate date, int monthsToShift) {
        return date == null ? null : date.plusMonths(monthsToShift);
    }
}
