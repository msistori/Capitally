package com.capitally.app.mapper;

import com.capitally.app.core.entity.AccountEntity;
import com.capitally.app.model.request.AccountRequestDTO;
import com.capitally.app.model.response.AccountResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AccountMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "currencyInitialBalance.code", target = "currencyInitialBalanceCode")
    AccountResponseDTO mapAccountEntityToDTO(AccountEntity entity);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(source = "currencyInitialBalanceCode", target = "currencyInitialBalance.code")
    AccountEntity mapAccountDTOToEntity(AccountRequestDTO dto);
}
