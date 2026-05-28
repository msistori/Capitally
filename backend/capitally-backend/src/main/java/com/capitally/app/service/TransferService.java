package com.capitally.app.service;

import com.capitally.app.core.entity.AccountEntity;
import com.capitally.app.core.entity.CurrencyEntity;
import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.enums.TransactionTypeEnum;
import com.capitally.app.core.repository.AccountRepository;
import com.capitally.app.core.repository.CurrencyRepository;
import com.capitally.app.core.repository.TransactionRepository;
import com.capitally.app.core.repository.UserRepository;
import com.capitally.app.model.request.TransferRequestDTO;
import com.capitally.app.model.response.TransferResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final CurrencyRepository currencyRepository;

    @Transactional
    public TransferResponseDTO postTransfer(TransferRequestDTO input) {
        validate(input);

        AccountEntity source = accountRepository.findByIdAndUser_Id(input.getSourceAccountId(), input.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        AccountEntity destination = accountRepository.findByIdAndUser_Id(input.getDestinationAccountId(), input.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        UserEntity user = userRepository.getReferenceById(input.getUserId());
        CurrencyEntity currency = currencyRepository.getReferenceById(input.getCurrencyCode());
        LocalDate transferDate = input.getDate() != null ? input.getDate() : LocalDate.now();
        String description = normalizeDescription(input.getDescription());

        TransactionEntity debit = TransactionEntity.builder()
                .user(user)
                .account(source)
                .amount(input.getAmount())
                .currency(currency)
                .date(transferDate)
                .description(description)
                .transactionType(TransactionTypeEnum.EXPENSE)
                .isRecurring(false)
                .transferCounterpartyAccount(destination)
                .build();

        TransactionEntity credit = TransactionEntity.builder()
                .user(user)
                .account(destination)
                .amount(input.getAmount())
                .currency(currency)
                .date(transferDate)
                .description(description)
                .transactionType(TransactionTypeEnum.INCOME)
                .isRecurring(false)
                .transferCounterpartyAccount(source)
                .build();

        transactionRepository.save(debit);
        transactionRepository.save(credit);

        String transferGroupId = buildTransferGroupId(debit);
        debit.setTransferGroupId(transferGroupId);
        credit.setTransferGroupId(transferGroupId);

        transactionRepository.saveAll(List.of(debit, credit));
        return toResponse(debit, credit);
    }

    public List<TransferResponseDTO> getTransfers(BigInteger userId, LocalDate startDate, LocalDate endDate) {
        return transactionRepository.findByUser_IdAndTransferGroupIdIsNotNull(userId).stream()
                .filter(transaction -> isInsideRange(transaction, startDate, endDate))
                .collect(Collectors.groupingBy(TransactionEntity::getTransferGroupId))
                .values()
                .stream()
                .map(this::toResponse)
                .flatMap(List::stream)
                .sorted(Comparator.comparing(TransferResponseDTO::getDate).reversed())
                .toList();
    }

    @Transactional
    public TransferResponseDTO putTransfer(String transferGroupId, TransferRequestDTO input) {
        validate(input);

        List<TransactionEntity> transactions = transactionRepository.findByUser_IdAndTransferGroupId(input.getUserId(), transferGroupId);
        Map<TransactionTypeEnum, TransactionEntity> byType = transactions.stream()
                .collect(Collectors.toMap(TransactionEntity::getTransactionType, t -> t, (first, second) -> first));

        TransactionEntity debit = byType.get(TransactionTypeEnum.EXPENSE);
        TransactionEntity credit = byType.get(TransactionTypeEnum.INCOME);

        if (debit == null || credit == null) {
            throw new IllegalArgumentException("Transfer not found");
        }

        AccountEntity source = accountRepository.findByIdAndUser_Id(input.getSourceAccountId(), input.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Source account not found"));
        AccountEntity destination = accountRepository.findByIdAndUser_Id(input.getDestinationAccountId(), input.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Destination account not found"));
        CurrencyEntity currency = currencyRepository.getReferenceById(input.getCurrencyCode());
        LocalDate transferDate = input.getDate() != null ? input.getDate() : LocalDate.now();
        String description = normalizeDescription(input.getDescription());

        debit.setAccount(source);
        debit.setAmount(input.getAmount());
        debit.setCurrency(currency);
        debit.setDate(transferDate);
        debit.setDescription(description);
        debit.setTransactionType(TransactionTypeEnum.EXPENSE);
        debit.setIsRecurring(false);
        debit.setTransferCounterpartyAccount(destination);

        credit.setAccount(destination);
        credit.setAmount(input.getAmount());
        credit.setCurrency(currency);
        credit.setDate(transferDate);
        credit.setDescription(description);
        credit.setTransactionType(TransactionTypeEnum.INCOME);
        credit.setIsRecurring(false);
        credit.setTransferCounterpartyAccount(source);

        transactionRepository.saveAll(List.of(debit, credit));
        return toResponse(debit, credit);
    }

    private void validate(TransferRequestDTO input) {
        if (input.getUserId() == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (input.getSourceAccountId() == null || input.getDestinationAccountId() == null) {
            throw new IllegalArgumentException("Both accounts are required");
        }
        if (input.getSourceAccountId().equals(input.getDestinationAccountId())) {
            throw new IllegalArgumentException("Source and destination accounts must be different");
        }
        if (input.getAmount() == null || input.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
        if (input.getCurrencyCode() == null || input.getCurrencyCode().isBlank()) {
            throw new IllegalArgumentException("Currency is required");
        }
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank()
                ? "Giroconto"
                : description.trim();
    }

    private String buildTransferGroupId(TransactionEntity debit) {
        return "TRF-" + debit.getId();
    }

    private boolean isInsideRange(TransactionEntity transaction, LocalDate startDate, LocalDate endDate) {
        LocalDate date = transaction.getDate();
        if (date == null) return false;
        if (startDate != null && date.isBefore(startDate)) return false;
        return endDate == null || !date.isAfter(endDate);
    }

    private List<TransferResponseDTO> toResponse(List<TransactionEntity> transactions) {
        Map<TransactionTypeEnum, TransactionEntity> byType = transactions.stream()
                .collect(Collectors.toMap(TransactionEntity::getTransactionType, t -> t, (first, second) -> first));

        TransactionEntity debit = byType.get(TransactionTypeEnum.EXPENSE);
        TransactionEntity credit = byType.get(TransactionTypeEnum.INCOME);

        if (debit == null || credit == null) {
            return List.of();
        }

        return List.of(toResponse(debit, credit));
    }

    private TransferResponseDTO toResponse(TransactionEntity debit, TransactionEntity credit) {
        return TransferResponseDTO.builder()
                .transferGroupId(debit.getTransferGroupId())
                .sourceTransactionId(debit.getId())
                .destinationTransactionId(credit.getId())
                .sourceAccountId(debit.getAccount().getId())
                .sourceAccountName(debit.getAccount().getName())
                .sourceAccountIconName(debit.getAccount().getIconName())
                .destinationAccountId(credit.getAccount().getId())
                .destinationAccountName(credit.getAccount().getName())
                .destinationAccountIconName(credit.getAccount().getIconName())
                .amount(debit.getAmount())
                .currencyCode(debit.getCurrency().getCode())
                .date(debit.getDate())
                .description(debit.getDescription())
                .build();
    }
}
