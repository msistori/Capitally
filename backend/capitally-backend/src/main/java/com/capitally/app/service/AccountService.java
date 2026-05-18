package com.capitally.app.service;

import com.capitally.app.core.entity.AccountEntity;
import com.capitally.app.core.entity.CategoryEntity;
import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.core.repository.AccountRepository;
import com.capitally.app.core.repository.TransactionRepository;
import com.capitally.app.mapper.AccountMapper;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

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

        return accountMapper.mapAccountEntityToDTO(accountRepository.save(existing));
    }

    public void deleteAccount(BigInteger userId, BigInteger accountId, String name, BigDecimal initialBalance) {
        if(accountId != null) {
            Optional<AccountEntity> accountToDelete = accountRepository.findByIdAndUser_Id(accountId, userId);
            if(accountToDelete.isPresent()) {
                moveTransactionsFromAccountsToDefault(userId, accountToDelete.get());
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
                accountsToDelete.forEach(a -> moveTransactionsFromAccountsToDefault(userId, a));

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

    private void moveTransactionsFromAccountsToDefault(BigInteger userId, AccountEntity accountEntity) {
        AccountEntity defaultAccount = accountRepository.findByNameAndUser_Id(DEFAULT_ACCOUNT, userId)
                .orElse(null);

        if (defaultAccount == null) {
            return ;
        }

        List<TransactionEntity> transactions =
                transactionRepository.findByUser_IdAndAccount_Name(userId, accountEntity.getName());

        transactions.forEach(t -> t.setAccount(defaultAccount));

        transactionRepository.saveAll(transactions);
    }
}