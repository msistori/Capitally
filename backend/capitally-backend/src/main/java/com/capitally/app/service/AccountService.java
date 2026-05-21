package com.capitally.app.service;

import com.capitally.app.core.entity.AccountEntity;
import com.capitally.app.core.entity.CurrencyEntity;
import com.capitally.app.core.repository.AccountRepository;
import com.capitally.app.core.repository.TransactionRepository;
import com.capitally.app.mapper.AccountMapper;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.capitally.app.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.app.utils.CapitallyUtils.buildLikePredicate;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AccountMapper accountMapper;

    private final String DEFAULT_ACCOUNT = "BANK";

    public AccountResponseDTO postAccount(AccountRequestDTO input) {
        AccountEntity entity = accountMapper.mapAccountDTOToEntity(input);
        entity.setCurrencyInitialBalance(buildInitialBalanceCurrency(input.getCurrencyInitialBalanceCode()));
        normalizeInitialBalanceCurrency(entity);
        normalizeAccountDetails(entity);
        return accountMapper.mapAccountEntityToDTO(accountRepository.save(entity));
    }

    public List<AccountResponseDTO> getAccounts(BigInteger userId, String name, BigDecimal minBalance, BigDecimal maxBalance) {
        Specification<AccountEntity> spec = buildSpecification(userId, name, minBalance, maxBalance, false);
        List<AccountResponseDTO> accounts = accountRepository.findAll(spec).stream()
                .map(accountMapper::mapAccountEntityToDTO)
                .toList();

        if (!CollectionUtils.isEmpty(accounts)
                && accounts.stream()
                .map(AccountResponseDTO::getName).collect(Collectors.toSet())
                .contains(DEFAULT_ACCOUNT)
                && accounts.size() > 1) {
            accounts = accounts.stream().filter(a -> !a.getName().equalsIgnoreCase(DEFAULT_ACCOUNT)).toList();
        }

        return accounts;
    }

    public AccountResponseDTO putAccount(BigInteger id, AccountRequestDTO dto) {
        AccountEntity existing = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        existing.setName(dto.getName());
        existing.setInitialBalance(dto.getInitialBalance());
        existing.setIconName(dto.getIconName());
        existing.setIncludeInTotalBalance(dto.getIncludeInTotalBalance());
        existing.setCurrencyInitialBalance(buildInitialBalanceCurrency(dto.getCurrencyInitialBalanceCode()));
        normalizeInitialBalanceCurrency(existing);
        normalizeAccountDetails(existing);

        return accountMapper.mapAccountEntityToDTO(accountRepository.save(existing));
    }

    public void deleteAccount(BigInteger userId, BigInteger accountId, String name, BigDecimal initialBalance) {
        if(accountId != null) {
            Optional<AccountEntity> accountToDelete = accountRepository.findByIdAndUser_Id(accountId, userId);
            if(accountToDelete.isPresent()) {
                ensureAccountsHaveNoTransactions(userId, List.of(accountId));
                accountRepository.deleteById(accountId);
            }
        } else {
            Specification<AccountEntity> spec = buildSpecification(
                    userId,
                    name,
                    initialBalance, initialBalance,
                    true);
            List<AccountEntity> accountsToDelete = accountRepository.findAll(spec);

            if(!CollectionUtils.isEmpty(accountsToDelete)) {
                ensureAccountsHaveNoTransactions(
                        userId,
                        accountsToDelete.stream().map(AccountEntity::getId).toList()
                );
                accountRepository.delete(spec);
            }
        }
    }

    private Specification<AccountEntity> buildSpecification(BigInteger userId, String name,
                                                            BigDecimal minBalance, BigDecimal maxBalance, boolean isDeleting) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if(isDeleting) {
                predicates.add(cb.notEqual(root.get("name"), DEFAULT_ACCOUNT));
            }

            addIfNotNull(predicates, userId, () -> cb.equal(root.get("user").get("id"), userId));
            addIfNotNull(predicates, name, () -> buildLikePredicate(cb, root.get("name"), name));
            addIfNotNull(predicates, minBalance, () -> cb.greaterThanOrEqualTo(root.get("initialBalance"), minBalance));
            addIfNotNull(predicates, maxBalance, () -> cb.lessThanOrEqualTo(root.get("initialBalance"), maxBalance));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void normalizeInitialBalanceCurrency(AccountEntity entity) {
        if (entity.getInitialBalance() == null) {
            entity.setCurrencyInitialBalance(null);
        }
    }

    private void normalizeAccountDetails(AccountEntity entity) {
        if (entity.getIconName() == null || entity.getIconName().isBlank()) {
            entity.setIconName("account_balance_wallet");
        }

        if (entity.getIncludeInTotalBalance() == null) {
            entity.setIncludeInTotalBalance(true);
        }
    }

    private CurrencyEntity buildInitialBalanceCurrency(String currencyInitialBalanceCode) {
        if (currencyInitialBalanceCode == null || currencyInitialBalanceCode.isBlank()) {
            return null;
        }

        return CurrencyEntity.builder()
                .code(currencyInitialBalanceCode)
                .build();
    }

    private void ensureAccountsHaveNoTransactions(BigInteger userId, List<BigInteger> accountIds) {
        if (CollectionUtils.isEmpty(accountIds)) {
            return;
        }

        if (transactionRepository.existsByUser_IdAndAccount_IdIn(userId, accountIds)
                || transactionRepository.existsByUser_IdAndTransferCounterpartyAccount_IdIn(userId, accountIds)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Accounts with transactions cannot be deleted"
            );
        }
    }
}
