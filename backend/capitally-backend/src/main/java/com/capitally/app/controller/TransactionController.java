package com.capitally.app.controller;

import com.capitally.app.analytics.AnalyticsConsent;
import com.capitally.app.analytics.AnalyticsEvent;
import com.capitally.app.analytics.PostHogAnalyticsService;
import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.TransactionRequestDTO;
import com.capitally.app.model.response.TransactionResponseDTO;
import com.capitally.app.service.TransactionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
@Tag(name = "Transaction", description = "API crud per Transaction")
public class TransactionController {

    private final TransactionService transactionService;
    private final PostHogAnalyticsService analyticsService;

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> postTransaction(
            @RequestBody TransactionRequestDTO input,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        input.setUserId(user.getId());
        TransactionResponseDTO response = transactionService.postTransaction(input);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSACTION_CREATED,
                transactionProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> getTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) BigInteger accountId,
            @RequestParam(required = false) BigInteger categoryId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount
    ) {
        List<TransactionResponseDTO> response = transactionService.getTransactions(
                user.getId(), accountId, categoryId, startDate, endDate, minAmount, maxAmount
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> putTransaction(
            @PathVariable BigInteger id,
            @RequestBody TransactionRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        dto.setUserId(user.getId());
        TransactionResponseDTO response = transactionService.putTransaction(user.getId(), id, dto);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSACTION_UPDATED,
                transactionProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping()
    public ResponseEntity<Void> deleteTransaction(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) BigInteger transactionId,
            @RequestParam(required = false) BigInteger accountId,
            @RequestParam(required = false) BigInteger categoryId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        transactionService.deleteTransaction(user.getId(), transactionId, accountId, categoryId, startDate, endDate, minAmount, maxAmount);
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("single_transaction", transactionId != null);
        properties.put("has_filters", accountId != null || categoryId != null || startDate != null || endDate != null
                || minAmount != null || maxAmount != null);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSACTION_DELETED,
                properties
        );
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> transactionProperties(TransactionResponseDTO transaction) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("transaction_type", transaction.getTransactionType() != null ? transaction.getTransactionType().name() : null);
        properties.put("currency_code", transaction.getCurrencyCode());
        properties.put("has_category", transaction.getCategoryId() != null);
        properties.put("is_recurring", Boolean.TRUE.equals(transaction.getIsRecurring()));
        properties.put("is_transfer", transaction.getTransferGroupId() != null);
        return properties;
    }
}
