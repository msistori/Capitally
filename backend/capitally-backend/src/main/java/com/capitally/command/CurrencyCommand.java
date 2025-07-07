package com.capitally.command;

import com.capitally.core.entity.CurrencyEntity;
import com.capitally.core.repository.CurrencyRepository;
import com.capitally.mapper.CurrencyMapper;
import com.capitally.model.request.CurrencyRequestDTO;
import com.capitally.model.response.CurrencyResponseDTO;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static com.capitally.utils.CapitallyUtils.addIfNotNull;
import static com.capitally.utils.CapitallyUtils.buildLikePredicate;

@Component
@RequiredArgsConstructor
public class CurrencyCommand {

    private final CurrencyMapper currencyMapper;
    private final CurrencyRepository currencyRepository;

    public CurrencyResponseDTO saveCurrency(CurrencyRequestDTO input) {
        CurrencyEntity currencyEntity = currencyMapper.mapCurrencyDTOToEntity(input);
        return currencyMapper.mapCurrencyEntityToDTO(currencyRepository.save(currencyEntity));
    }

    public List<CurrencyResponseDTO> getCurrencies(String name, String code) {
        Specification<CurrencyEntity> spec = buildSpecification(name, code);
        return currencyRepository.findAll(spec).stream()
                .map(currencyMapper::mapCurrencyEntityToDTO)
                .toList();
    }

    public CurrencyResponseDTO putCurrency(String code, CurrencyRequestDTO dto) {
        currencyRepository.deleteById(code);

        CurrencyEntity newCurrency = new CurrencyEntity();

        newCurrency.setName(dto.getName());
        newCurrency.setCode(dto.getCode());

        return currencyMapper.mapCurrencyEntityToDTO(currencyRepository.save(newCurrency));
    }

    private Specification<CurrencyEntity> buildSpecification(String name, String code) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            addIfNotNull(predicates, name, () -> buildLikePredicate(cb, root.get("name"), name));
            addIfNotNull(predicates, code, () -> buildLikePredicate(cb, root.get("code"), code));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}