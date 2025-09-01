package com.capitally.core.enums;

import java.time.Period;

public enum TransactionRecurrencePeriodEnum {
    DAILY(Period.ofDays(1)),
    WEEKLY(Period.ofWeeks(1)),
    MONTHLY(Period.ofMonths(1)),
    YEARLY(Period.ofYears(1)),
    TWO_DAYS(Period.ofDays(2)),
    TEN_DAYS(Period.ofDays(10)),
    TWELVE_DAYS(Period.ofDays(12)),
    FIFTEEN_DAYS(Period.ofDays(15)),
    THIRTY_DAYS(Period.ofDays(30)),
    THIRTY_ONE_DAYS(Period.ofDays(31)),
    TWO_WEEKS(Period.ofWeeks(2)),
    FOUR_WEEKS(Period.ofWeeks(4)),
    TWO_MONTHS(Period.ofMonths(2)),
    THREE_MONTHS(Period.ofMonths(3)),
    FOUR_MONTHS(Period.ofMonths(4)),
    SIX_MONTHS(Period.ofMonths(6)),
    TWO_YEARS(Period.ofYears(2));

    private final Period step;

    TransactionRecurrencePeriodEnum(Period step) {
        this.step = step;
    }

    public Period step() {
        return step;
    }
}
