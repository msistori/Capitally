package com.capitally.app.controller;

import com.capitally.app.analytics.AnalyticsConsent;
import com.capitally.app.analytics.AnalyticsEvent;
import com.capitally.app.analytics.PostHogAnalyticsService;
import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.TransferRequestDTO;
import com.capitally.app.model.response.TransferResponseDTO;
import com.capitally.app.service.TransferService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/transfer", "/api/transfer"})
@RequiredArgsConstructor
@Tag(name = "Transfer", description = "API per giroconti tra conti")
public class TransferController {

    private final TransferService transferService;
    private final PostHogAnalyticsService analyticsService;

    @PostMapping
    public ResponseEntity<TransferResponseDTO> postTransfer(
            @RequestBody TransferRequestDTO input,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        input.setUserId(user.getId());
        TransferResponseDTO response = transferService.postTransfer(input);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSFER_CREATED,
                transferProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{transferGroupId}")
    public ResponseEntity<TransferResponseDTO> putTransfer(
            @PathVariable String transferGroupId,
            @RequestBody TransferRequestDTO input,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        input.setUserId(user.getId());
        TransferResponseDTO response = transferService.putTransfer(transferGroupId, input);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSFER_UPDATED,
                transferProperties(response)
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{transferGroupId}")
    public ResponseEntity<Void> deleteTransfer(
            @PathVariable String transferGroupId,
            @AuthenticationPrincipal UserPrincipal user,
            @RequestHeader(value = AnalyticsConsent.HEADER_NAME, required = false) String analyticsConsentHeader
    ) {
        transferService.deleteTransfer(user.getId(), transferGroupId);
        analyticsService.captureIfConsented(
                analyticsConsentHeader,
                user.getId(),
                AnalyticsEvent.TRANSFER_DELETED,
                Map.of("single_transfer", true)
        );
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TransferResponseDTO>> getTransfers(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(transferService.getTransfers(user.getId(), startDate, endDate));
    }

    private Map<String, Object> transferProperties(TransferResponseDTO transfer) {
        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put("currency_code", transfer.getCurrencyCode());
        properties.put("has_description", transfer.getDescription() != null && !transfer.getDescription().isBlank());
        return properties;
    }
}
