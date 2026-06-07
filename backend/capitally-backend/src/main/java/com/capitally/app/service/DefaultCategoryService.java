package com.capitally.app.service;

import com.capitally.app.core.entity.CategoryEntity;
import com.capitally.app.core.entity.UserEntity;
import com.capitally.app.core.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DefaultCategoryService {
    private static final String EN_LANGUAGE = "en";
    private static final String DEFAULT_LANGUAGE = "it";

    private final CategoryRepository categoryRepository;

    public void createForUser(UserEntity user, String language) {
        List<DefaultCategory> defaults = EN_LANGUAGE.equals(normalizeLanguage(language))
                ? englishCategories()
                : italianCategories();

        categoryRepository.saveAll(defaults.stream()
                .map(category -> CategoryEntity.builder()
                        .macroCategory(category.macroCategory())
                        .category(category.category())
                        .iconName(category.iconName())
                        .user(user)
                        .build())
                .toList());
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return DEFAULT_LANGUAGE;
        }

        return language.trim().toLowerCase(Locale.ROOT);
    }

    private List<DefaultCategory> italianCategories() {
        return List.of(
                new DefaultCategory("Casa", "Affitto", "Home"),
                new DefaultCategory("Casa", "Mutuo", "Bank"),
                new DefaultCategory("Casa", "Utenze", "Wifi"),
                new DefaultCategory("Casa", "Manutenzione", "Spanner"),
                new DefaultCategory("Cibo", "Bar", "Coffee"),
                new DefaultCategory("Cibo", "Ristorante", "Food"),
                new DefaultCategory("Cibo", "Locale", "Cocktail"),
                new DefaultCategory("Cibo", "Spesa", "Grater-cutting"),
                new DefaultCategory("Trasporti", "Carburante", "Fuel"),
                new DefaultCategory("Trasporti", "Mezzi", "Metro"),
                new DefaultCategory("Trasporti", "Taxi", "Taxi"),
                new DefaultCategory("Trasporti", "Autolavaggio", "Car-wash"),
                new DefaultCategory("Abbonamenti", "Musica", "Music-note"),
                new DefaultCategory("Abbonamenti", "ChatGPT", "Robot"),
                new DefaultCategory("Abbonamenti", "Amazon", "Amazon"),
                new DefaultCategory("Abbonamenti", "Palestra", "Barbell"),
                new DefaultCategory("Divertimento", "Stadio", "Stadium"),
                new DefaultCategory("Divertimento", "Concerto", "Concert-day"),
                new DefaultCategory("Divertimento", "Cinema", "Popcorn"),
                new DefaultCategory("Divertimento", "Videogiochi", "Games"),
                new DefaultCategory("Other", "Other", "Question-mark")
        );
    }

    private List<DefaultCategory> englishCategories() {
        return List.of(
                new DefaultCategory("Home", "Rent", "Home"),
                new DefaultCategory("Home", "Mortgage", "Bank"),
                new DefaultCategory("Home", "Utilities", "Wifi"),
                new DefaultCategory("Home", "Maintenance", "Spanner"),
                new DefaultCategory("Food", "Coffee", "Coffee"),
                new DefaultCategory("Food", "Restaurant", "Food"),
                new DefaultCategory("Food", "Night Out", "Cocktail"),
                new DefaultCategory("Food", "Groceries", "Grater-cutting"),
                new DefaultCategory("Transport", "Fuel", "Fuel"),
                new DefaultCategory("Transport", "Transit", "Metro"),
                new DefaultCategory("Transport", "Taxi", "Taxi"),
                new DefaultCategory("Transport", "Car Wash", "Car-wash"),
                new DefaultCategory("Subscriptions", "Music", "Music-note"),
                new DefaultCategory("Subscriptions", "ChatGPT", "Robot"),
                new DefaultCategory("Subscriptions", "Amazon", "Amazon"),
                new DefaultCategory("Subscriptions", "Gym", "Barbell"),
                new DefaultCategory("Entertainment", "Stadium", "Stadium"),
                new DefaultCategory("Entertainment", "Concert", "Concert-day"),
                new DefaultCategory("Entertainment", "Cinema", "Popcorn"),
                new DefaultCategory("Entertainment", "Video Games", "Games"),
                new DefaultCategory("Other", "Other", "Question-mark")
        );
    }

    private record DefaultCategory(String macroCategory, String category, String iconName) {
    }
}
