package com.capitally.controller;

import com.capitally.model.request.TransactionRequestDTO;
import com.capitally.model.response.TransactionResponseDTO;
import com.capitally.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable BigInteger id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}