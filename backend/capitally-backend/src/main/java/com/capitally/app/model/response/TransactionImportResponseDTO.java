package com.capitally.app.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionImportResponseDTO {
    private ImportResult result;
    private ImportSummary summary;
    private List<ImportError> errors;

    public enum ImportResult {
        SUCCESS,
        FAILED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportSummary {
        private int totalRows;
        private int importedTransactions;
        private List<String> newAccounts;
        private Map<String, List<String>> newCategories;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportError {
        private Integer rowNumber;
        private String field;
        private String message;
        private String value;

        public static ImportError of(Integer rowNumber, String field, String message, String value) {
            return ImportError.builder()
                    .rowNumber(rowNumber)
                    .field(field)
                    .message(message)
                    .value(value)
                    .build();
        }

        public static ImportError of(String message) {
            return ImportError.builder()
                    .message(message)
                    .build();
        }
    }

    public void addError(Integer rowNumber, String field, String message, String value) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(ImportError.of(rowNumber, field, message, value));
    }

    public void addError(String message) {
        if (this.errors == null) {
            this.errors = new ArrayList<>();
        }
        this.errors.add(ImportError.of(message));
    }

    public boolean isSuccess() {
        return result == ImportResult.SUCCESS;
    }

    public boolean hasErrors() {
        return this.errors != null && !this.errors.isEmpty();
    }
}