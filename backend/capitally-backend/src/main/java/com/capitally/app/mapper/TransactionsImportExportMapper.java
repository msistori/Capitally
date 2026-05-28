package com.capitally.app.mapper;

import com.capitally.app.core.entity.*;
import com.capitally.app.core.repository.AccountRepository;
import com.capitally.app.core.repository.CategoryRepository;
import com.capitally.app.core.repository.CurrencyRepository;
import com.capitally.app.model.request.TransactionImportDTO;
import jakarta.persistence.EntityNotFoundException;
import org.mapstruct.*;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class TransactionsImportExportMapper {

    @Autowired
    protected AccountRepository accountRepository;

    @Autowired
    protected CurrencyRepository currencyRepository;

    @Autowired
    protected CategoryRepository categoryRepository;

    @Mapping(target = "user", source = "user")
    @Mapping(target = "account", expression = "java(findAccount(dto.getAccountName(), user))")
    @Mapping(target = "currency", expression = "java(findCurrency(dto.getCurrencyCode()))")
    @Mapping(target = "category", expression = "java(findCategory(dto.getCategory(), dto.getMacroCategory(), user))")
    @Mapping(target = "amount", source = "dto.amount")
    @Mapping(target = "date", source = "dto.date")
    @Mapping(target = "description", source = "dto.description")
    @Mapping(target = "transactionType", source = "dto.transactionType")
    @Mapping(target = "isRecurring", source = "dto.isRecurring")
    @Mapping(target = "recurrencePeriod", source = "dto.recurrencePeriod")
    @Mapping(target = "recurrenceEndDate", source = "dto.recurrenceEndDate")
    @Mapping(target = "id", ignore = true)
    public abstract TransactionEntity toEntity(TransactionImportDTO dto, UserEntity user);

    protected AccountEntity findAccount(String accountName, UserEntity user) {
        return accountRepository.findByNameAndUser_Id(accountName, user.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Account '%s' not found for user %s", accountName, user.getId())
                ));
    }

    protected CurrencyEntity findCurrency(String currencyCode) {
        return currencyRepository.findByCode(currencyCode)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Currency '%s' not found", currencyCode)
                ));
    }

    protected CategoryEntity findCategory(String category, String macroCategory, UserEntity user) {
        if (isBlank(category) && isBlank(macroCategory)) {
            return null;
        }

        return categoryRepository.findByCategoryAndMacroCategoryAndUser_Id(category, macroCategory, user.getId())
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Category '%s' in macro-category '%s' not found for user %s",
                                category, macroCategory, user.getId())
                ));
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
