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
    public void downloadTemplateCsv(OutputStream outputStream) {
        try (BufferedWriter writer = createWriter(outputStream);
             CSVPrinter printer = createPrinter(writer)) {

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
        return new CSVPrinter(writer, csvFormat());
    }

    private CSVFormat csvFormat() {
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

    private String safe(String v) {
        return v == null ? "" : v;
    }

    private String formatDate(LocalDate d) {
        return d == null ? "" : d.format(DATE_FORMATTER);
    }

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
