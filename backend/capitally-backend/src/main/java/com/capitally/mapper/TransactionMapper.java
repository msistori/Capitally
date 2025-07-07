package com.capitally.mapper;

import com.capitally.core.entity.TransactionEntity;
import com.capitally.model.request.TransactionRequestDTO;
import com.capitally.model.response.TransactionResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TransactionMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "account.id", target = "accountId")
    @Mapping(source = "currency.code", target = "currencyCode")
    TransactionResponseDTO mapTransactionEntityToDTO(TransactionEntity entity);

    TransactionEntity mapTransactionDTOToEntity(TransactionRequestDTO requestDTO);
}
