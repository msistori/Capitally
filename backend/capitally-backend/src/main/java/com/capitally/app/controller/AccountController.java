package com.capitally.app.controller;

import com.capitally.app.analytics.AnalyticsConsent;
import com.capitally.app.analytics.AnalyticsEvent;
import com.capitally.app.analytics.PostHogAnalyticsService;
import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import com.capitally.app.service.AccountService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
@Tag(name = "Account", description = "API crud per Account")
public class AccountController {

    private final AccountService accountService;
    private final PostHogAnalyticsService analyticsService;

    @PostMapping
    public ResponseEntity<AccountResponseDTO> postAccount(
            @RequestBody AccountRequestDTO input,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        input.setUserId(user.getId());
        AccountResponseDTO response = accountService.postAccount(input);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.ACCOUNT_CREATED,
                accountProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDTO>> getAccounts(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal minBalance,
            @RequestParam(required = false) BigDecimal maxBalance
    ) {
        return ResponseEntity.ok(accountService.getAccounts(user.getId(), name, minBalance, maxBalance));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountResponseDTO> putAccount(
            @PathVariable BigInteger id,
            @RequestBody AccountRequestDTO dto,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        dto.setUserId(user.getId());
        AccountResponseDTO response = accountService.putAccount(user.getId(), id, dto);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.ACCOUNT_UPDATED,
                accountProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping()
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) BigInteger accountId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BigDecimal initialBalance,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        accountService.deleteAccount(user.getId(), accountId, name, initialBalance);
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("single_account", accountId != null);
        properties.put("has_filters", name != null || initialBalance != null);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.ACCOUNT_DELETED,
                properties
        );
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> accountProperties(AccountResponseDTO account) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("has_initial_balance", account.getInitialBalance() != null);
        properties.put("currency_code", account.getCurrencyInitialBalanceCode());
        properties.put("included_in_total_balance", Boolean.TRUE.equals(account.getIncludeInTotalBalance()));
        return properties;
    }
}
