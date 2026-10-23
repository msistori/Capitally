package com.capitally.app.model.response;

import java.util.List;

public record RecentTransactionsResponseDTO(List<TransactionResponseDTO> content, boolean last) {}
