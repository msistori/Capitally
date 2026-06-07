package com.capitally.app.service;

import com.capitally.app.core.entity.*;
import com.capitally.app.core.enums.TransactionRecurrencePeriodEnum;
import com.capitally.app.core.enums.TransactionTypeEnum;
import com.capitally.app.core.repository.*;
import com.capitally.app.core.repository.spec.TransactionExportSpecifications;
import com.capitally.app.mapper.TransactionsImportExportMapper;
import com.capitally.app.model.request.TransactionExportFilter;
import com.capitally.app.model.request.TransactionImportDTO;
import com.capitally.app.model.response.TransactionImportResponseDTO;
import jakarta.persistence.EntityManager;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.apache.commons.io.ByteOrderMark;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionsImportExportService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CurrencyRepository currencyRepository;
    private final AccountRepository accountRepository;

    private EntityManager entityManager;
    private TransactionsImportExportMapper transactionsImportExportMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final int PAGE_SIZE = 2000;

    @Transactional
    public TransactionImportResponseDTO importTransactions(MultipartFile file, BigInteger userId) {
        TransactionImportResponseDTO response = TransactionImportResponseDTO.builder()
                .summary(TransactionImportResponseDTO.ImportSummary.builder()
                        .totalRows(0)
                        .importedTransactions(0)
                        .importedTransfers(0)
                        .importedAccounts(0)
                        .newAccounts(new ArrayList<>())
                        .newCategories(new HashMap<>())
                        .build())
                .build();

        try {
            List<TransactionImportDTO> transactions = parseCsv(file, response);
            response.getSummary().setTotalRows(transactions.size());

            if (response.hasErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found: " + userId));

            ValidationResult validation = validateAndSync(transactions, user, response);

            if (validation.hasCriticalErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            List<TransactionEntity> entities = transactions.stream()
                    .map(dto -> transactionsImportExportMapper.toEntity(dto, user))
                    .toList();

            transactionRepository.saveAll(entities);

            response.getSummary().setImportedTransactions(entities.size());
            response.getSummary().setNewAccounts(new ArrayList<>(validation.getNewAccounts()));
            response.getSummary().setNewCategories(validation.getNewCategories());

            response.setResult(TransactionImportResponseDTO.ImportResult.SUCCESS);

        } catch (Exception e) {
            response.addError("Errore critico durante l'importazione: " + e.getMessage());
            response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }

        return response;
    }

    @Transactional
    public TransactionImportResponseDTO importTransfers(MultipartFile file, BigInteger userId) {
        TransactionImportResponseDTO response = emptyImportResponse();

        try {
            List<TransferImportRow> transfers = parseTransfersCsv(file, response);
            response.getSummary().setTotalRows(transfers.size());

            if (response.hasErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));

            TransferImportValidation validation = validateAndSyncTransfers(transfers, user, response);
            if (validation.hasCriticalErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            List<TransactionEntity> savedTransactions = new ArrayList<>();
            for (TransferImportRow transfer : transfers) {
                AccountEntity source = accountRepository.findByNameAndUser_Id(transfer.sourceAccount(), userId)
                        .orElseThrow(() -> new IllegalArgumentException("Conto di origine non trovato: " + transfer.sourceAccount()));
                AccountEntity destination = accountRepository.findByNameAndUser_Id(transfer.destinationAccount(), userId)
                        .orElseThrow(() -> new IllegalArgumentException("Conto di destinazione non trovato: " + transfer.destinationAccount()));
                CurrencyEntity currency = currencyRepository.findByCode(transfer.currencyCode())
                        .orElseThrow(() -> new IllegalArgumentException("Valuta non trovata: " + transfer.currencyCode()));

                TransactionEntity debit = TransactionEntity.builder()
                        .user(user)
                        .account(source)
                        .amount(transfer.amount())
                        .currency(currency)
                        .date(transfer.date())
                        .description(transfer.description())
                        .transactionType(TransactionTypeEnum.EXPENSE)
                        .isRecurring(false)
                        .transferCounterpartyAccount(destination)
                        .build();

                TransactionEntity credit = TransactionEntity.builder()
                        .user(user)
                        .account(destination)
                        .amount(transfer.amount())
                        .currency(currency)
                        .date(transfer.date())
                        .description(transfer.description())
                        .transactionType(TransactionTypeEnum.INCOME)
                        .isRecurring(false)
                        .transferCounterpartyAccount(source)
                        .build();

                transactionRepository.save(debit);
                transactionRepository.save(credit);

                String transferGroupId = "TRF-" + debit.getId();
                debit.setTransferGroupId(transferGroupId);
                credit.setTransferGroupId(transferGroupId);

                savedTransactions.addAll(transactionRepository.saveAll(List.of(debit, credit)));
            }

            response.getSummary().setImportedTransfers(transfers.size());
            response.getSummary().setImportedTransactions(savedTransactions.size());
            response.getSummary().setNewAccounts(new ArrayList<>(validation.newAccounts()));
            response.setResult(TransactionImportResponseDTO.ImportResult.SUCCESS);

        } catch (Exception e) {
            response.addError("Errore durante l'importazione dei giroconti. Verifica che il file sia corretto.");
            response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }

        return response;
    }

    @Transactional
    public TransactionImportResponseDTO importAccounts(MultipartFile file, BigInteger userId) {
        TransactionImportResponseDTO response = emptyImportResponse();

        try {
            List<AccountImportRow> accountRows = parseAccountsCsv(file, response);
            response.getSummary().setTotalRows(accountRows.size());

            if (response.hasErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));

            Map<String, AccountImportState> accountsByName = consolidateAccounts(accountRows, response);
            if (response.hasErrors()) {
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            Set<String> currencyCodes = accountsByName.values().stream()
                    .map(AccountImportState::currencyCode)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<String, CurrencyEntity> currenciesByCode = currencyRepository.findByCodeIn(currencyCodes).stream()
                    .collect(Collectors.toMap(CurrencyEntity::getCode, c -> c));

            Set<String> missingCurrencies = new HashSet<>(currencyCodes);
            missingCurrencies.removeAll(currenciesByCode.keySet());
            if (!missingCurrencies.isEmpty()) {
                missingCurrencies.forEach(currency ->
                        response.addError(null, "currency", "Valuta non trovata nel sistema", currency));
                response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
                return response;
            }

            List<AccountEntity> existingAccounts = accountRepository.findByNameInAndUser_Id(accountsByName.keySet(), userId);
            Map<String, AccountEntity> existingByName = existingAccounts.stream()
                    .collect(Collectors.toMap(AccountEntity::getName, account -> account));

            List<String> newAccounts = new ArrayList<>();
            List<AccountEntity> accountsToSave = new ArrayList<>();

            for (AccountImportState importedAccount : accountsByName.values()) {
                AccountEntity account = existingByName.get(importedAccount.accountName());
                if (account == null) {
                    account = AccountEntity.builder()
                            .name(importedAccount.accountName())
                            .user(user)
                            .build();
                    newAccounts.add(importedAccount.accountName());
                }

                account.setInitialBalance(importedAccount.initialBalance());
                account.setCurrencyInitialBalance(importedAccount.currencyCode() != null
                        ? currenciesByCode.get(importedAccount.currencyCode())
                        : null);
                account.setIncludeInTotalBalance(importedAccount.includeInTotalBalance());
                account.setIconName(importedAccount.iconName());
                accountsToSave.add(account);
            }

            accountRepository.saveAll(accountsToSave);

            response.getSummary().setImportedAccounts(accountsToSave.size());
            response.getSummary().setNewAccounts(newAccounts);
            response.setResult(TransactionImportResponseDTO.ImportResult.SUCCESS);

        } catch (Exception e) {
            response.addError("Errore durante l'importazione dei conti. Verifica che il file sia corretto.");
            response.setResult(TransactionImportResponseDTO.ImportResult.FAILED);
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }

        return response;
    }

    @Transactional(readOnly = true)
    public void exportTransactionsCsv(OutputStream outputStream, java.math.BigInteger userId, TransactionExportFilter filter) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer)) {

            Specification<TransactionEntity> spec = TransactionExportSpecifications.build(userId, filter);
            Sort sort = defaultSort();

            streamPages(spec, sort, printer);

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    @Transactional(readOnly = true)
    public void exportTransfersCsv(OutputStream outputStream, BigInteger userId, TransactionExportFilter filter) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer, transfersCsvFormat())) {

            List<TransferCsvRow> transfers = transactionRepository.findByUser_IdAndTransferGroupIdIsNotNull(userId).stream()
                    .collect(Collectors.groupingBy(TransactionEntity::getTransferGroupId))
                    .values()
                    .stream()
                    .map(this::toTransferCsvRow)
                    .flatMap(Optional::stream)
                    .filter(row -> matchesTransferFilter(row, filter))
                    .sorted(Comparator
                            .comparing(TransferCsvRow::date, Comparator.nullsLast(Comparator.naturalOrder()))
                            .reversed()
                            .thenComparing(TransferCsvRow::transferGroupId))
                    .toList();

            for (TransferCsvRow transfer : transfers) {
                printer.printRecord(
                        formatDate(transfer.date()),
                        safe(transfer.sourceAccount()),
                        safe(transfer.destinationAccount()),
                        transfer.amount() != null ? transfer.amount().toPlainString() : "",
                        safe(transfer.currencyCode()),
                        safe(transfer.description())
                );
            }

            printer.flush();

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    @Transactional(readOnly = true)
    public void exportAccountsCsv(OutputStream outputStream, BigInteger userId) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer, accountsCsvFormat())) {

            List<AccountEntity> accounts = accountRepository.findByUserId(userId).stream()
                    .sorted(Comparator.comparing(AccountEntity::getName, String.CASE_INSENSITIVE_ORDER))
                    .toList();

            for (AccountEntity account : accounts) {
                Map<String, BigDecimal> balances = calculateAccountBalances(account);
                String initialCurrency = account.getCurrencyInitialBalance() != null
                        ? account.getCurrencyInitialBalance().getCode()
                        : null;

                Set<String> currencies = new TreeSet<>(balances.keySet());
                if (initialCurrency != null) {
                    currencies.add(initialCurrency);
                }

                if (currencies.isEmpty()) {
                    printer.printRecord(
                            safe(account.getName()),
                            "",
                            formatDecimal(account.getInitialBalance()),
                            "",
                            account.getIncludeInTotalBalance(),
                            safe(account.getIconName())
                    );
                    continue;
                }

                for (String currency : currencies) {
                    printer.printRecord(
                            safe(account.getName()),
                            safe(currency),
                            Objects.equals(currency, initialCurrency) ? formatDecimal(account.getInitialBalance()) : "",
                            formatDecimal(balances.get(currency)),
                            account.getIncludeInTotalBalance(),
                            safe(account.getIconName())
                    );
                }
            }

            printer.flush();

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    @Transactional(readOnly = true)
    public void downloadTemplateCsv(OutputStream outputStream) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer)) {

            printer.flush();

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    @Transactional(readOnly = true)
    public void downloadTransfersTemplateCsv(OutputStream outputStream) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer, transfersCsvFormat())) {

            printer.flush();

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    @Transactional(readOnly = true)
    public void downloadAccountsTemplateCsv(OutputStream outputStream) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer, accountsCsvFormat())) {

            printer.flush();

        } catch (Exception e) {
            throw new RuntimeException("Export failed", e);
        }
    }

    private List<TransactionImportDTO> parseCsv(MultipartFile file, TransactionImportResponseDTO response) {
        List<TransactionImportDTO> transactions = new ArrayList<>();

        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setDelimiter(';')
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .setSkipHeaderRecord(true)
                .get();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        new BOMInputStream(file.getInputStream(), false,
                                ByteOrderMark.UTF_8, ByteOrderMark.UTF_16LE, ByteOrderMark.UTF_16BE),
                        StandardCharsets.UTF_8));
             CSVParser csvParser = csvFormat.parse(reader)) {

            int rowNum = 1;
            for (CSVRecord record : csvParser) {
                rowNum++;
                try {
                    TransactionImportDTO dto = TransactionImportDTO.builder()
                            .accountName(blankToNull(record.get("account_name")))
                            .amount(parseDecimalWithComma(record.get("amount")))
                            .currencyCode(blankToNull(record.get("currency")))
                            .date(LocalDate.parse(record.get("date"), DATE_FORMATTER))
                            .description(blankToNull(record.get("description")))
                            .macroCategory(blankToNull(record.get("macrocategory")))
                            .category(blankToNull(record.get("category")))
                            .transactionType(TransactionTypeEnum.valueOf(record.get("transaction_type")))
                            .isRecurring(Boolean.parseBoolean(record.get("is_recurring")))
                            .recurrencePeriod(record.isMapped("recurrence_period") && !record.get("recurrence_period").isEmpty()
                                    ? TransactionRecurrencePeriodEnum.valueOf(record.get("recurrence_period"))
                                    : null)
                            .recurrenceEndDate(record.isMapped("recurrence_end_date") && !record.get("recurrence_end_date").isEmpty()
                                    ? LocalDate.parse(record.get("recurrence_end_date"), DATE_FORMATTER)
                                    : null)
                            .rowNumber(rowNum)
                            .build();

                    transactions.add(dto);

                } catch (Exception e) {
                    response.addError(rowNum, null, "Errore di parsing", e.getMessage());
                }
            }

        } catch (Exception e) {
            response.addError("Errore nella lettura del file CSV: " + e.getMessage());
        }

        return transactions;
    }

    private List<TransferImportRow> parseTransfersCsv(MultipartFile file, TransactionImportResponseDTO response) {
        List<TransferImportRow> transfers = new ArrayList<>();

        try (CSVParser csvParser = parseCsvRecords(file)) {
            int rowNum = 1;
            for (CSVRecord record : csvParser) {
                rowNum++;
                try {
                    BigDecimal amount = parseDecimalWithComma(record.get("amount"));
                    transfers.add(new TransferImportRow(
                            rowNum,
                            LocalDate.parse(record.get("date"), DATE_FORMATTER),
                            blankToNull(record.get("source_account")),
                            blankToNull(record.get("destination_account")),
                            amount,
                            blankToNull(record.get("currency")),
                            Optional.ofNullable(blankToNull(record.get("description"))).orElse("Giroconto")
                    ));
                } catch (Exception e) {
                    response.addError(rowNum, null, "Riga giroconto non leggibile", "Controlla data, importo e colonne obbligatorie");
                }
            }
        } catch (Exception e) {
            response.addError("Errore nella lettura del file CSV dei giroconti");
        }

        return transfers;
    }

    private List<AccountImportRow> parseAccountsCsv(MultipartFile file, TransactionImportResponseDTO response) {
        List<AccountImportRow> accounts = new ArrayList<>();

        try (CSVParser csvParser = parseCsvRecords(file)) {
            int rowNum = 1;
            for (CSVRecord record : csvParser) {
                rowNum++;
                try {
                    accounts.add(new AccountImportRow(
                            rowNum,
                            blankToNull(record.get("account_name")),
                            blankToNull(record.get("currency")),
                            parseOptionalDecimal(record, "initial_balance"),
                            parseOptionalDecimal(record, "final_balance"),
                            parseOptionalBoolean(record, "include_in_total_balance"),
                            Optional.ofNullable(blankToNull(record.get("icon_name"))).orElse("account_balance_wallet")
                    ));
                } catch (Exception e) {
                    response.addError(rowNum, null, "Riga conto non leggibile", "Controlla importi, valuta e colonne obbligatorie");
                }
            }
        } catch (Exception e) {
            response.addError("Errore nella lettura del file CSV dei conti");
        }

        return accounts;
    }

    private CSVParser parseCsvRecords(MultipartFile file) throws IOException {
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setDelimiter(';')
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .setSkipHeaderRecord(true)
                .get();

        BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        new BOMInputStream(file.getInputStream(), false,
                                ByteOrderMark.UTF_8, ByteOrderMark.UTF_16LE, ByteOrderMark.UTF_16BE),
                        StandardCharsets.UTF_8));
        return csvFormat.parse(reader);
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BigDecimal parseDecimalWithComma(String value) {
        String normalized = value.replace(',', '.');
        return new BigDecimal(normalized);
    }

    private BigDecimal parseOptionalDecimal(CSVRecord record, String field) {
        if (!record.isMapped(field)) {
            return null;
        }

        String value = blankToNull(record.get(field));
        return value == null ? null : parseDecimalWithComma(value);
    }

    private Boolean parseOptionalBoolean(CSVRecord record, String field) {
        if (!record.isMapped(field)) {
            return true;
        }

        String value = blankToNull(record.get(field));
        return value == null ? true : Boolean.parseBoolean(value);
    }

    private ValidationResult validateAndSync(List<TransactionImportDTO> transactions,
                                             UserEntity user,
                                             TransactionImportResponseDTO response) {
        ValidationResult result = new ValidationResult();

        validateRequiredFields(transactions, response, result);

        if (result.hasCriticalErrors()) {
            return result;
        }

        // Valida currencies (BLOCCANTE - non vengono create automaticamente)
        Set<String> currencyCodes = transactions.stream()
                .map(TransactionImportDTO::getCurrencyCode)
                .collect(Collectors.toSet());

        List<CurrencyEntity> currencies = currencyRepository.findByCodeIn(currencyCodes);
        Map<String, CurrencyEntity> currencyMap = currencies.stream()
                .collect(Collectors.toMap(CurrencyEntity::getCode, c -> c));

        Set<String> missingCurrencies = new HashSet<>(currencyCodes);
        missingCurrencies.removeAll(currencyMap.keySet());

        if (!missingCurrencies.isEmpty()) {
            result.setCriticalError(true);
            missingCurrencies.forEach(currency ->
                    response.addError(null, "currency",
                            "Valuta non trovata nel sistema", currency)
            );
            return result;
        }

        // Sincronizza accounts (vengono creati automaticamente se mancanti)
        Set<String> accountNames = transactions.stream()
                .map(TransactionImportDTO::getAccountName)
                .collect(Collectors.toSet());

        Set<String> newAccounts = syncMissingAccounts(user.getId(), accountNames);
        result.setNewAccounts(newAccounts);

        // Sincronizza categories (vengono create automaticamente se mancanti)
        Map<String, List<String>> categories = transactions.stream()
                .filter(t -> t.getMacroCategory() != null || t.getCategory() != null)
                .map(t -> new AbstractMap.SimpleEntry<>(t.getMacroCategory(), t.getCategory()))
                .distinct()
                .collect(Collectors.groupingBy(
                        Map.Entry::getKey,
                        Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                ));

        Map<String, List<String>> newCategories = syncMissingCategories(user.getId(), categories);
        result.setNewCategories(newCategories);

        return result;
    }

    private TransferImportValidation validateAndSyncTransfers(List<TransferImportRow> transfers,
                                                              UserEntity user,
                                                              TransactionImportResponseDTO response) {
        boolean hasCriticalErrors = false;

        for (TransferImportRow transfer : transfers) {
            if (transfer.sourceAccount() == null) {
                hasCriticalErrors = true;
                response.addError(transfer.rowNumber(), "source_account", "Conto di origine obbligatorio", null);
            }
            if (transfer.destinationAccount() == null) {
                hasCriticalErrors = true;
                response.addError(transfer.rowNumber(), "destination_account", "Conto di destinazione obbligatorio", null);
            }
            if (transfer.currencyCode() == null) {
                hasCriticalErrors = true;
                response.addError(transfer.rowNumber(), "currency", "Valuta obbligatoria", null);
            }
            if (transfer.amount() == null || transfer.amount().compareTo(BigDecimal.ZERO) <= 0) {
                hasCriticalErrors = true;
                response.addError(transfer.rowNumber(), "amount", "L'importo del giroconto deve essere maggiore di zero", null);
            }
            if (transfer.sourceAccount() != null && transfer.sourceAccount().equals(transfer.destinationAccount())) {
                hasCriticalErrors = true;
                response.addError(transfer.rowNumber(), "destination_account", "Origine e destinazione devono essere conti diversi", transfer.destinationAccount());
            }
        }

        if (hasCriticalErrors) {
            return new TransferImportValidation(true, Collections.emptySet());
        }

        Set<String> currencyCodes = transfers.stream()
                .map(TransferImportRow::currencyCode)
                .collect(Collectors.toSet());
        Set<String> foundCurrencies = currencyRepository.findByCodeIn(currencyCodes).stream()
                .map(CurrencyEntity::getCode)
                .collect(Collectors.toSet());

        Set<String> missingCurrencies = new HashSet<>(currencyCodes);
        missingCurrencies.removeAll(foundCurrencies);
        if (!missingCurrencies.isEmpty()) {
            missingCurrencies.forEach(currency ->
                    response.addError(null, "currency", "Valuta non trovata nel sistema", currency));
            return new TransferImportValidation(true, Collections.emptySet());
        }

        Set<String> accountNames = transfers.stream()
                .flatMap(transfer -> List.of(transfer.sourceAccount(), transfer.destinationAccount()).stream())
                .collect(Collectors.toSet());
        Set<String> newAccounts = syncMissingAccounts(user.getId(), accountNames);

        return new TransferImportValidation(false, newAccounts);
    }

    private Map<String, AccountImportState> consolidateAccounts(List<AccountImportRow> rows,
                                                                TransactionImportResponseDTO response) {
        Map<String, AccountImportState> accountsByName = new LinkedHashMap<>();

        for (AccountImportRow row : rows) {
            if (row.accountName() == null) {
                response.addError(row.rowNumber(), "account_name", "Nome conto obbligatorio", null);
                continue;
            }

            if (row.initialBalance() != null && row.currencyCode() == null) {
                response.addError(row.rowNumber(), "currency", "La valuta e obbligatoria quando e presente un saldo iniziale", null);
                continue;
            }

            AccountImportState current = accountsByName.get(row.accountName());
            if (current == null) {
                accountsByName.put(row.accountName(), new AccountImportState(
                        row.accountName(),
                        Optional.ofNullable(row.initialBalance()).orElse(BigDecimal.ZERO),
                        row.initialBalance() != null ? row.currencyCode() : null,
                        row.includeInTotalBalance(),
                        row.iconName()
                ));
                continue;
            }

            if (row.initialBalance() != null) {
                boolean sameInitialBalance = current.initialBalance().compareTo(row.initialBalance()) == 0;
                boolean sameCurrency = Objects.equals(current.currencyCode(), row.currencyCode());
                if (current.currencyCode() != null && (!sameInitialBalance || !sameCurrency)) {
                    response.addError(row.rowNumber(), "initial_balance", "Il conto ha piu saldi iniziali diversi", row.accountName());
                } else if (current.currencyCode() == null) {
                    accountsByName.put(row.accountName(), new AccountImportState(
                            current.accountName(),
                            row.initialBalance(),
                            row.currencyCode(),
                            row.includeInTotalBalance(),
                            row.iconName()
                    ));
                }
            }
        }

        return accountsByName;
    }

    private void validateRequiredFields(List<TransactionImportDTO> transactions,
                                        TransactionImportResponseDTO response,
                                        ValidationResult result) {
        for (TransactionImportDTO transaction : transactions) {
            validateRequiredField(transaction.getAccountName(), transaction.getRowNumber(), "account_name", response, result);
            validateRequiredField(transaction.getCurrencyCode(), transaction.getRowNumber(), "currency", response, result);

            boolean hasMacroCategory = transaction.getMacroCategory() != null;
            boolean hasCategory = transaction.getCategory() != null;

            if (hasMacroCategory != hasCategory) {
                result.setCriticalError(true);
                response.addError(
                        transaction.getRowNumber(),
                        hasMacroCategory ? "category" : "macrocategory",
                        "Macro categoria e categoria devono essere entrambe valorizzate o entrambe vuote",
                        hasMacroCategory ? transaction.getMacroCategory() : transaction.getCategory()
                );
            }
        }
    }

    private void validateRequiredField(String value,
                                       Integer rowNumber,
                                       String field,
                                       TransactionImportResponseDTO response,
                                       ValidationResult result) {
        if (value != null) {
            return;
        }

        result.setCriticalError(true);
        response.addError(rowNumber, field, "Campo obbligatorio mancante", null);
    }

    public Set<String> syncMissingAccounts(BigInteger userId, Set<String> incomingAccounts) {
        if (incomingAccounts == null || incomingAccounts.isEmpty()) {
            return Collections.emptySet();
        }

        List<AccountEntity> accounts = accountRepository.findByNameInAndUser_Id(incomingAccounts, userId);
        Set<String> existingAccounts = accounts.stream()
                .map(AccountEntity::getName)
                .collect(Collectors.toSet());

        Set<String> accountsToSave = new HashSet<>(incomingAccounts);
        accountsToSave.removeAll(existingAccounts);

        if (accountsToSave.isEmpty()) {
            return Collections.emptySet();
        }

        Set<AccountEntity> accountEntitiesToSave = accountsToSave.stream()
                .map(account -> AccountEntity.builder()
                        .name(account)
                        .initialBalance(BigDecimal.ZERO)
                        .user(entityManager.getReference(UserEntity.class, userId))
                        .build())
                .collect(Collectors.toSet());

        accountRepository.saveAll(accountEntitiesToSave);

        return accountsToSave;
    }

    public Map<String, List<String>> syncMissingCategories(BigInteger userId,
                                                           Map<String, List<String>> incomingCategories) {
        if (incomingCategories == null || incomingCategories.isEmpty()) {
            return Collections.emptyMap();
        }

        Set<String> macros = incomingCategories.keySet();

        List<CategoryRepository.CategoryProjection> existingCategoryProjections =
                categoryRepository.findByUser_IdAndMacroCategoryIn(userId, macros);

        Set<String> existingPairs = existingCategoryProjections.stream()
                .map(r -> r.getMacroCategory() + "::" + r.getCategory())
                .collect(Collectors.toSet());

        List<CategoryEntity> categoriesToSave = new ArrayList<>();
        Map<String, List<String>> categoriesSaved = new HashMap<>();

        incomingCategories.forEach((macro, categories) -> {
            if (categories == null) return;

            categories.stream()
                    .filter(Objects::nonNull)
                    .filter(s -> !s.isEmpty())
                    .distinct()
                    .filter(cat -> !existingPairs.contains(macro + "::" + cat))
                    .forEach(cat -> {
                        CategoryEntity e = CategoryEntity.builder()
                                .macroCategory(macro)
                                .category(cat)
                                .iconName("Question-mark")
                                .user(entityManager.getReference(UserEntity.class, userId))
                                .build();
                        categoriesToSave.add(e);
                        categoriesSaved.computeIfAbsent(macro, k -> new ArrayList<>()).add(cat);
                    });
        });

        if (!categoriesToSave.isEmpty()) {
            categoryRepository.saveAll(categoriesToSave);
        }

        return categoriesSaved;
    }

    private BufferedWriter createWriter(OutputStream outputStream) {
        return new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8));
    }

    private CSVPrinter createPrinter(BufferedWriter writer) throws Exception {
        return new CSVPrinter(writer, transactionsCsvFormat());
    }

    private CSVPrinter createPrinter(BufferedWriter writer, CSVFormat csvFormat) throws Exception {
        return new CSVPrinter(writer, csvFormat);
    }

    private CSVFormat transactionsCsvFormat() {
        return CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(
                        "date",
                        "macrocategory",
                        "category",
                        "account_name",
                        "amount",
                        "currency",
                        "description",
                        "transaction_type",
                        "is_recurring",
                        "recurrence_period",
                        "recurrence_end_date"
                )
                .build();
    }

    private CSVFormat transfersCsvFormat() {
        return CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(
                        "date",
                        "source_account",
                        "destination_account",
                        "amount",
                        "currency",
                        "description"
                )
                .build();
    }

    private CSVFormat accountsCsvFormat() {
        return CSVFormat.DEFAULT.builder()
                .setDelimiter(';')
                .setHeader(
                        "account_name",
                        "currency",
                        "initial_balance",
                        "final_balance",
                        "include_in_total_balance",
                        "icon_name"
                )
                .build();
    }

    private Sort defaultSort() {
        return Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id"));
    }

    private void streamPages(Specification<TransactionEntity> spec, Sort sort, CSVPrinter printer) throws Exception {
        int page = 0;
        Page<TransactionEntity> chunk;

        do {
            chunk = transactionRepository.findAll(spec, PageRequest.of(page, PAGE_SIZE, sort));
            writeChunk(chunk, printer);
            printer.flush();
            page++;
        } while (chunk.hasNext());
    }

    private void writeChunk(Page<TransactionEntity> chunk, CSVPrinter printer) throws Exception {
        for (TransactionEntity t : chunk.getContent()) {
            printer.printRecord(toCsvRow(t));
        }
    }

    private Object[] toCsvRow(TransactionEntity t) {
        return new Object[]{
                formatDate(t.getDate()),
                safe(t.getCategory() != null ? t.getCategory().getMacroCategory() : null),
                safe(t.getCategory() != null ? t.getCategory().getCategory() : null),
                safe(t.getAccount() != null ? t.getAccount().getName() : null),
                t.getAmount() != null ? t.getAmount().toPlainString() : "",
                safe(t.getCurrency() != null ? t.getCurrency().getCode() : null),
                safe(t.getDescription()),
                t.getTransactionType() != null ? t.getTransactionType().name() : "",
                t.getIsRecurring() != null ? t.getIsRecurring().toString() : "",
                t.getRecurrencePeriod() != null ? t.getRecurrencePeriod().name() : "",
                formatDate(t.getRecurrenceEndDate())
        };
    }

    private Optional<TransferCsvRow> toTransferCsvRow(List<TransactionEntity> transactions) {
        Map<TransactionTypeEnum, TransactionEntity> byType = transactions.stream()
                .collect(Collectors.toMap(TransactionEntity::getTransactionType, t -> t, (first, second) -> first));

        TransactionEntity debit = byType.get(TransactionTypeEnum.EXPENSE);
        TransactionEntity credit = byType.get(TransactionTypeEnum.INCOME);

        if (debit == null || credit == null) {
            return Optional.empty();
        }

        return Optional.of(new TransferCsvRow(
                debit.getTransferGroupId(),
                debit.getDate(),
                debit.getAccount() != null ? debit.getAccount().getName() : null,
                credit.getAccount() != null ? credit.getAccount().getName() : null,
                debit.getAmount(),
                debit.getCurrency() != null ? debit.getCurrency().getCode() : null,
                debit.getDescription()
        ));
    }

    private boolean matchesTransferFilter(TransferCsvRow transfer, TransactionExportFilter filter) {
        if (filter == null) {
            return true;
        }

        if (filter.getStartDate() != null && (transfer.date() == null || transfer.date().isBefore(filter.getStartDate()))) {
            return false;
        }
        if (filter.getEndDate() != null && (transfer.date() == null || transfer.date().isAfter(filter.getEndDate()))) {
            return false;
        }
        if (filter.getMinAmount() != null && (transfer.amount() == null || transfer.amount().compareTo(filter.getMinAmount()) < 0)) {
            return false;
        }
        if (filter.getMaxAmount() != null && (transfer.amount() == null || transfer.amount().compareTo(filter.getMaxAmount()) > 0)) {
            return false;
        }
        if (filter.getCurrency() != null && !filter.getCurrency().isBlank()
                && !filter.getCurrency().trim().equalsIgnoreCase(transfer.currencyCode())) {
            return false;
        }
        if (filter.getAccount() != null && !filter.getAccount().isBlank()) {
            String account = filter.getAccount().trim();
            if (!account.equalsIgnoreCase(transfer.sourceAccount()) && !account.equalsIgnoreCase(transfer.destinationAccount())) {
                return false;
            }
        }
        if (filter.getDescription() != null && !filter.getDescription().isBlank()) {
            String description = Optional.ofNullable(transfer.description()).orElse("").toLowerCase();
            return description.contains(filter.getDescription().trim().toLowerCase());
        }

        return true;
    }

    private Map<String, BigDecimal> calculateAccountBalances(AccountEntity account) {
        Map<String, BigDecimal> balances = new HashMap<>();
        BigDecimal initialBalance = Optional.ofNullable(account.getInitialBalance()).orElse(BigDecimal.ZERO);

        Optional.ofNullable(account.getCurrencyInitialBalance())
                .map(CurrencyEntity::getCode)
                .ifPresent(currency -> balances.merge(currency, initialBalance, BigDecimal::add));

        Map<String, BigDecimal> transactionSumsByCurrency = transactionRepository.findAllByAccountId(account.getId()).stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCurrency().getCode(),
                        Collectors.reducing(BigDecimal.ZERO, t -> {
                            BigDecimal amount = Optional.ofNullable(t.getAmount()).orElse(BigDecimal.ZERO);
                            return TransactionTypeEnum.EXPENSE.equals(t.getTransactionType()) ? amount.negate() : amount;
                        }, BigDecimal::add)
                ));

        for (Map.Entry<String, BigDecimal> entry : transactionSumsByCurrency.entrySet()) {
            balances.merge(entry.getKey(), entry.getValue(), BigDecimal::add);
        }

        return balances;
    }

    private String formatDecimal(BigDecimal value) {
        return value == null ? "" : value.toPlainString();
    }

    private String safe(String v) {
        return v == null ? "" : v;
    }

    private String formatDate(LocalDate d) {
        return d == null ? "" : d.format(DATE_FORMATTER);
    }

    private TransactionImportResponseDTO emptyImportResponse() {
        return TransactionImportResponseDTO.builder()
                .summary(TransactionImportResponseDTO.ImportSummary.builder()
                        .totalRows(0)
                        .importedTransactions(0)
                        .importedTransfers(0)
                        .importedAccounts(0)
                        .newAccounts(new ArrayList<>())
                        .newCategories(new HashMap<>())
                        .build())
                .build();
    }

    private record TransferImportRow(
            int rowNumber,
            LocalDate date,
            String sourceAccount,
            String destinationAccount,
            BigDecimal amount,
            String currencyCode,
            String description
    ) {}

    private record AccountImportRow(
            int rowNumber,
            String accountName,
            String currencyCode,
            BigDecimal initialBalance,
            BigDecimal finalBalance,
            Boolean includeInTotalBalance,
            String iconName
    ) {}

    private record AccountImportState(
            String accountName,
            BigDecimal initialBalance,
            String currencyCode,
            Boolean includeInTotalBalance,
            String iconName
    ) {}

    private record TransferCsvRow(
            String transferGroupId,
            LocalDate date,
            String sourceAccount,
            String destinationAccount,
            BigDecimal amount,
            String currencyCode,
            String description
    ) {}

    private record TransferImportValidation(boolean hasCriticalErrors, Set<String> newAccounts) {}

    @Data
    private static class ValidationResult {
        private boolean criticalError = false;
        private Set<String> newAccounts = new HashSet<>();
        private Map<String, List<String>> newCategories = new HashMap<>();

        public boolean hasCriticalErrors() {
            return criticalError;
        }
    }

    @Autowired
    public void setEntityManager(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Autowired
    public void setTransactionsImportExportMapper(TransactionsImportExportMapper transactionsImportExportMapper) {
        this.transactionsImportExportMapper = transactionsImportExportMapper;
    }
}
