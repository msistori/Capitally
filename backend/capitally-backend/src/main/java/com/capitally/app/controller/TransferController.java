package com.capitally.app.controller;

import com.capitally.app.model.request.TransferRequestDTO;
import com.capitally.app.model.response.TransferResponseDTO;
import com.capitally.app.service.TransferService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigInteger;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/transfer", "/api/transfer"})
@RequiredArgsConstructor
@Tag(name = "Transfer", description = "API per giroconti tra conti")
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public ResponseEntity<TransferResponseDTO> postTransfer(@RequestBody TransferRequestDTO input) {
        return ResponseEntity.ok(transferService.postTransfer(input));
    }

    @PutMapping("/{transferGroupId}")
    public ResponseEntity<TransferResponseDTO> putTransfer(
            @PathVariable String transferGroupId,
            @RequestBody TransferRequestDTO input
    ) {
        return ResponseEntity.ok(transferService.putTransfer(transferGroupId, input));
    }

    @GetMapping
    public ResponseEntity<List<TransferResponseDTO>> getTransfers(
            @RequestParam BigInteger userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(transferService.getTransfers(userId, startDate, endDate));
    }
}
