package com.capitally.app.service;

import com.capitally.app.config.ResendProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResendEmailService {
    private final ResendProperties properties;
    private static final String IT = "it";

    public void sendTemporaryPassword(String to, String temporaryPassword, String lang) {
        validateConfigured();

        RestClient.create(properties.getHost())
                .post()
                .uri("/emails")
                .header("Authorization", "Bearer " + properties.getApiKey())
                .header("User-Agent", "capitally-backend")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", properties.getFrom(),
                        "to", List.of(to),
                        "subject", buildSubject(lang),
                        "html", buildHtml(temporaryPassword, lang),
                        "text", buildText(temporaryPassword, lang)
                ))
                .retrieve()
                .toBodilessEntity();
    }

    public void validateConfigured() {
        if (!StringUtils.hasText(properties.getApiKey()) || !StringUtils.hasText(properties.getFrom())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "resend_not_configured");
        }
    }

    private String buildSubject(String lang) {
        if (IT.equals(lang))
            return "Capitally - nuova password temporanea";
        else return "Capitally - new temporary password";
    }

    private String buildHtml(String temporaryPassword, String lang) {
        if (IT.equals(lang))
            return """
                <p>Ciao,</p>
                <p>abbiamo generato una nuova password temporanea per il tuo account Capitally.</p>
                <p><strong>%s</strong></p>
                <p>Accedi con questa password e poi vai in Impostazioni per cambiarla.</p>
                """.formatted(temporaryPassword);
        else
            return """
                <p>Hello,</p>
                <p>we have generated a new temporary password for your Capitally account.</p>
                <p><strong>%s</strong></p>
                <p>Log in with this password, then go to Settings to change it.</p>
                """.formatted(temporaryPassword);
    }

    private String buildText(String temporaryPassword, String lang) {
        if (IT.equals(lang))
            return """
                Ciao,

                abbiamo generato una nuova password temporanea per il tuo account Capitally.

                Password temporanea: %s

                Accedi con questa password e poi vai in Impostazioni per cambiarla.
                """.formatted(temporaryPassword);
        else
            return """
                Hello,

                we have generated a new temporary password for your Capitally account.

                Temporary password: %s

                Log in with this password, then go to Settings to change it.
                """.formatted(temporaryPassword);
    }
}
