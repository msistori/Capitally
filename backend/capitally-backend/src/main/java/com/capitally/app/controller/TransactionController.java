package com.capitally.app.controller;

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
import java.util.List;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
@Tag(name = "Transaction", description = "API crud per Transaction")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<TransactionResponseDTO> postTransaction(@RequestBody TransactionRequestDTO input) {
        TransactionResponseDTO response = transactionService.postTransaction(input);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TransactionResponseDTO>> getTransactions(
            @RequestParam(required = false) BigInteger userId,
            @RequestParam(required = false) BigInteger accountId,
            @RequestParam(required = false) BigInteger categoryId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount
    ) {
        List<TransactionResponseDTO> response = transactionService.getTransactions(
                userId, accountId, categoryId, startDate, endDate, minAmount, maxAmount
        );
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponseDTO> putTransaction(@PathVariable BigInteger id, @RequestBody TransactionRequestDTO dto) {
        return ResponseEntity.ok(transactionService.putTransaction(id, dto));
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
            @RequestParam(required = false) BigDecimal maxAmount
    ) {
        transactionService.deleteTransaction(user.getId(), transactionId, accountId, categoryId, startDate, endDate, minAmount, maxAmount);
        return ResponseEntity.noContent().build();
    }
}