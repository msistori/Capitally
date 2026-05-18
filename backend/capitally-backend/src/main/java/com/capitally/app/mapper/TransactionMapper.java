package com.capitally.app.mapper;

import com.capitally.app.core.entity.TransactionEntity;
import com.capitally.app.model.request.TransactionRequestDTO;
import com.capitally.app.model.response.TransactionResponseDTO;
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
