package com.capitally.app.controller;

import com.capitally.app.core.enums.TransactionTypeEnum;
import com.capitally.app.core.security.UserPrincipal;
import com.capitally.app.model.request.TransactionExportFilter;
import com.capitally.app.model.response.TransactionImportResponseDTO;
import com.capitally.app.service.TransactionsImportExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
@Tag(name = "Transaction-Import/Export", description = "API per importare ed esportare transazioni")
public class TransactionsImportExportController {

    private final TransactionsImportExportService transactionsImportExportService;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Importa transazioni da CSV",
            description = "Carica un file CSV con transazioni da importare"
    )
    @ApiResponse(responseCode = "200", description = "Import completato con successo")
    @ApiResponse(responseCode = "422", description = "Errori di validazione")
    public ResponseEntity<TransactionImportResponseDTO> importTransactions(
            @Parameter(
                    description = "File CSV con le transazioni da importare",
                    required = true,
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE)
            )
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal user) {

        if (file == null || file.isEmpty()) {
            TransactionImportResponseDTO errorResponse = TransactionImportResponseDTO.builder()
                    .result(TransactionImportResponseDTO.ImportResult.FAILED)
                    .summary(TransactionImportResponseDTO.ImportSummary.builder()
                            .totalRows(0)
                            .importedTransactions(0)
                            .newAccounts(new ArrayList<>())
                            .newCategories(new HashMap<>())
                            .build())
                    .build();

            errorResponse.addError("File empty or not valid");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            TransactionImportResponseDTO errorResponse = TransactionImportResponseDTO.builder()
                    .result(TransactionImportResponseDTO.ImportResult.FAILED)
                    .summary(TransactionImportResponseDTO.ImportSummary.builder()
                            .totalRows(0)
                            .importedTransactions(0)
                            .newAccounts(new ArrayList<>())
                            .newCategories(new HashMap<>())
                            .build())
                    .build();

            errorResponse.addError("The file must be in CSV format");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        TransactionImportResponseDTO response = transactionsImportExportService.importTransactions(file, user.getId());

        if (response.getResult() == TransactionImportResponseDTO.ImportResult.SUCCESS) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @Operation(summary = "Esporta transazioni in CSV")
    public ResponseEntity<StreamingResponseBody> exportTransactions(
            @AuthenticationPrincipal UserPrincipal user,
            @RequestParam(required = false) String account,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String macroCategory,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) TransactionTypeEnum transactionType
    ) {
        if (minAmount != null && maxAmount != null && minAmount.compareTo(maxAmount) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "minAmount must be <= maxAmount"
            );
        }
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "startDate must be <= endDate"
            );
        }

        TransactionExportFilter filter = TransactionExportFilter.builder()
                .account(account)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .description(description)
                .startDate(startDate)
                .endDate(endDate)
                .macroCategory(macroCategory)
                .category(category)
                .currency(currency)
                .transactionType(transactionType)
                .build();

        StreamingResponseBody body = outputStream ->
                transactionsImportExportService.exportTransactionsCsv(outputStream, user.getId(), filter);

        String fileName = "transactions_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }

    @GetMapping(value = "/template", produces = "text/csv")
    @Operation(summary = "Scarica il template per importare le transazioni in CSV")
    public ResponseEntity<StreamingResponseBody> templateTransactions() {
        StreamingResponseBody body = outputStream ->
                transactionsImportExportService.downloadTemplateCsv(outputStream);

        String fileName = "template_transactions_" + LocalDate.now().format(DateTimeFormatter.ISO_DATE) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(body);
    }
}