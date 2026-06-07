package com.capitally.app.model.response;

import java.util.List;

public record UserDataExportResponseDTO(
        UserResponseDTO user,
        List<AccountResponseDTO> accounts,
        List<CategoryResponseDTO> categories,
        List<TransactionResponseDTO> transactions
) {}
