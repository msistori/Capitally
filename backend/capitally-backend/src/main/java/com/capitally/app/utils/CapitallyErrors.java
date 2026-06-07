package com.capitally.app.utils;

public class CapitallyErrors {

    /* AUTH */
    public static final String AUTH_USER_TAKEN_ERROR = "user_taken_error";
    public static final String AUTH_EMAIL_TAKEN_ERROR = "email_taken_error";
    public static final String AUTH_FORGOT_PASSWORD_DAILY_LIMIT_ERROR = "forgot_password_resend_daily_limit_exceeded";
    public static final String AUTH_FORGOT_PASSWORD_MONTHLY_LIMIT_ERROR = "forgot_password_resend_monthly_limit_exceeded";

    /* IMPORT/EXPORT TRANSACTIONS */
    public static final String IMPORT_ERROR = "error_during_import";
    public static final String IMPORT_EMPTY_FILE_ERROR = "empty_csv_file";
    public static final String IMPORT_ACCOUNTS_NOT_FOUND_ERROR = "accounts_not_found";
    public static final String IMPORT_CATEGORIES_NOT_FOUND_ERROR = "categories_not_found";
    public static final String IMPORT_CURRENCIES_NOT_FOUND_ERROR = "currencies_not_found";

}
