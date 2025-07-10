package com.capitally.core.repository;

import com.capitally.core.entity.view.MonthlyTransactionReportId;
import com.capitally.core.entity.view.MonthlyTransactionReportView;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigInteger;
import java.util.List;

public interface MonthlyTransactionReportViewRepository extends JpaRepository<MonthlyTransactionReportView, MonthlyTransactionReportId> {

    List<MonthlyTransactionReportView> findByIdUserIdAndIdMonthBetween(BigInteger userId, String startMonth, String endMonth);
}