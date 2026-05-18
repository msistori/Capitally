package com.capitally.app.mapper;

import com.capitally.app.core.entity.CurrencyEntity;
import com.capitally.app.model.request.CurrencyRequestDTO;
import com.capitally.app.model.response.CurrencyResponseDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CurrencyMapper {

    CurrencyResponseDTO mapCurrencyEntityToDTO(CurrencyEntity entity);

    CurrencyEntity mapCurrencyDTOToEntity(CurrencyRequestDTO dto);
}