package com.capitally.model.response;

import com.capitally.model.MonthlyTotalDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionsSummaryResponseDTO {
    private List<MonthlyTotalDTO> income;
    private List<MonthlyTotalDTO> expenses;
}