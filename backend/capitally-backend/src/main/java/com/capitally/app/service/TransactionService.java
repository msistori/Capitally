package com.capitally.app.service;

import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.core.repository.*;
import com.capitally.app.mapper.TransactionMapper;
import com.capitally.app.model.request.TransactionRequestDTO;
import com.capitally.app.model.response.TransactionResponseDTO;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import static com.capitally.app.utils.CapitallyUtils.addIfNotNull;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionMapper transactionMapper;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CurrencyRepository currencyRepository;
    private final AccountRepository accountRepository;

    public TransactionResponseDTO postTransaction(TransactionRequestDTO input) {

        TransactionEntity transactionEntity = transactionMapper.mapTransactionDTOToEntity(input);

        if (input.getCategoryId() != null) {
            transactionEntity.setCategory(categoryRepository.getReferenceById(input.getCategoryId()));
        }
        transactionEntity.setAccount(accountRepository.getReferenceById(input.getAccountId()));
        transactionEntity.setUser(userRepository.getReferenceById(input.getUserId()));
        transactionEntity.setCurrency(currencyRepository.getReferenceById(input.getCurrencyCode()));
        if (input.getTransferCounterpartyAccountId() != null) {
            transactionEntity.setTransferCounterpartyAccount(
                    accountRepository.getReferenceById(input.getTransferCounterpartyAccountId())
            );
        }

        return transactionMapper.mapTransactionEntityToDTO(transactionRepository.save(transactionEntity));
    }

    public List<TransactionResponseDTO> getTransactions(BigInteger userId, BigInteger accountId, BigInteger categoryId,
                                                        LocalDate startDate, LocalDate endDate,
                                                        BigDecimal minAmount, BigDecimal maxAmount) {
        Specification<TransactionEntity> spec = buildSpecification(userId, accountId, categoryId, startDate, endDate, minAmount, maxAmount);

        return transactionRepository.findAll(spec).stream()
                .sorted(Comparator.comparing(TransactionEntity::getDate).reversed())
                .map(transactionMapper::mapTransactionEntityToDTO)
                .toList();
    }

    public TransactionResponseDTO putTransaction(BigInteger id, TransactionRequestDTO dto) {
        TransactionEntity existing = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        existing.setAmount(dto.getAmount());
        existing.setAccount(accountRepository.getReferenceById(dto.getAccountId()));
        existing.setCurrency(currencyRepository.getReferenceById(dto.getCurrencyCode()));
        existing.setDate(dto.getDate());
        existing.setDescription(dto.getDescription());
        existing.setCategory(dto.getCategoryId() != null ? categoryRepository.getReferenceById(dto.getCategoryId()) : null);
        existing.setTransactionType(dto.getTransactionType());
        existing.setIsRecurring(dto.getIsRecurring());
        existing.setRecurrencePeriod(dto.getRecurrencePeriod());
        existing.setRecurrenceEndDate(dto.getRecurrenceEndDate());
        if (dto.getTransferCounterpartyAccountId() != null) {
            existing.setTransferCounterpartyAccount(accountRepository.getReferenceById(dto.getTransferCounterpartyAccountId()));
        }

        return transactionMapper.mapTransactionEntityToDTO(transactionRepository.save(existing));
    }

    public void deleteTransaction(BigInteger userId, BigInteger transactionId, BigInteger accountId, BigInteger categoryId,
                                  LocalDate startDate, LocalDate endDate, BigDecimal minAmount, BigDecimal maxAmount) {
        if(transactionId != null) {
            Optional<TransactionEntity> transactionToDelete = transactionRepository.findByIdAndUser_Id(transactionId, userId);
            if(transactionToDelete.isPresent()) {
                transactionRepository.deleteById(transactionId);
            }
        } else {
            Specification<TransactionEntity> spec = buildSpecification(userId, accountId, categoryId, startDate, endDate, minAmount, maxAmount);
            List<TransactionEntity> transactionsToDelete = transactionRepository.findAll(spec);

            if (!transactionsToDelete.isEmpty()) {
                transactionRepository.deleteAllInBatch(transactionsToDelete);
            }
        }
    }

    private Specification<TransactionEntity> buildSpecification(BigInteger userId, BigInteger accountId, BigInteger categoryId,
                                                                LocalDate startDate, LocalDate endDate,
                                                                BigDecimal minAmount, BigDecimal maxAmount) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, userId, () -> cb.equal(root.get("user").get("id"), userId));
            addIfNotNull(predicates, accountId, () -> cb.or(
                    cb.equal(root.get("account").get("id"), accountId),
                    cb.equal(root.join("transferCounterpartyAccount", JoinType.LEFT).get("id"), accountId)
            ));
            addIfNotNull(predicates, categoryId, () -> cb.equal(root.get("category").get("id"), categoryId));
            addIfNotNull(predicates, startDate, () -> cb.greaterThanOrEqualTo(root.get("date"), startDate));
            addIfNotNull(predicates, endDate, () -> cb.lessThanOrEqualTo(root.get("date"), endDate));
            addIfNotNull(predicates, minAmount, () -> cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            addIfNotNull(predicates, maxAmount, () -> cb.lessThanOrEqualTo(root.get("amount"), maxAmount));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
