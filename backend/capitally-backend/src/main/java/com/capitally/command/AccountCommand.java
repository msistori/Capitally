package com.capitally.command;

import com.capitally.core.entity.AccountEntity;
import com.capitally.core.repository.AccountRepository;
import com.capitally.mapper.AccountMapper;
import com.capitally.model.request.AccountRequestDTO;
import com.capitally.model.response.AccountResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import static com.capitally.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.utils.CapitallyUtils.buildLikePredicate;

@Component
@RequiredArgsConstructor
public class AccountCommand {

    private final AccountRepository accountRepository;
    private final AccountMapper accountMapper;

    public AccountResponseDTO postAccount(AccountRequestDTO input) {
        AccountEntity entity = accountMapper.mapAccountDTOToEntity(input);
        return accountMapper.mapAccountEntityToDTO(accountRepository.save(entity));
    }

    public List<AccountResponseDTO> getAccounts(BigInteger userId, String name, String type, BigDecimal minBalance, BigDecimal maxBalance) {
        Specification<AccountEntity> spec = buildSpecification(userId, name, type, minBalance, maxBalance);
        return accountRepository.findAll(spec).stream()
                .map(accountMapper::mapAccountEntityToDTO)
                .toList();
    }

    public AccountResponseDTO putAccount(BigInteger id, AccountRequestDTO dto) {
        AccountEntity existing = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        existing.setName(dto.getName());
        existing.setAccountType(dto.getAccountType());
        existing.setInitialBalance(dto.getInitialBalance());

        return accountMapper.mapAccountEntityToDTO(accountRepository.save(existing));
    }

    private Specification<AccountEntity> buildSpecification(BigInteger userId, String name, String type,
                                                            BigDecimal minBalance, BigDecimal maxBalance) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, userId, () -> cb.equal(root.get("user").get("id"), userId));
            addIfNotNull(predicates, name, () -> buildLikePredicate(cb, root.get("name"), name));
            addIfNotNull(predicates, type, () -> cb.equal(root.get("accountType"), type));
            addIfNotNull(predicates, minBalance, () -> cb.greaterThanOrEqualTo(root.get("initialBalance"), minBalance));
            addIfNotNull(predicates, maxBalance, () -> cb.lessThanOrEqualTo(root.get("initialBalance"), maxBalance));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}