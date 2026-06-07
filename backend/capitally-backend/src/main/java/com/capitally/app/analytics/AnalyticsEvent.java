package com.capitally.app.analytics;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnalyticsEvent {
    ACCOUNT_CREATED("account_created"),
    ACCOUNT_UPDATED("account_updated"),
    ACCOUNT_DELETED("account_deleted"),
    CSV_EXPORTED("csv_exported"),
    CSV_IMPORTED("csv_imported"),
    TRANSACTION_CREATED("transaction_created"),
    TRANSACTION_UPDATED("transaction_updated"),
    TRANSACTION_DELETED("transaction_deleted"),
    TRANSFER_CREATED("transfer_created"),
    TRANSFER_UPDATED("transfer_updated"),
    TRANSFER_DELETED("transfer_deleted");

    private final String eventName;
}
