package com.capitally.mapper;

import com.capitally.core.entity.CurrencyEntity;
import com.capitally.model.request.CurrencyRequestDTO;
import com.capitally.model.response.CurrencyResponseDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CurrencyMapper {

    CurrencyResponseDTO mapCurrencyEntityToDTO(CurrencyEntity entity);

    CurrencyEntity mapCurrencyDTOToEntity(CurrencyRequestDTO dto);
}