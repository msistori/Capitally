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
    private static final String DEFAULT_LOGO_URL = "https://capital-ly.com/assets/pwa/icon-192.png";

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
            return buildHtmlTemplate(
                    "Nuova password temporanea",
                    "Ciao, abbiamo generato una nuova password temporanea per il tuo account Capitally.",
                    "Password temporanea",
                    temporaryPassword,
                    "Cambio password obbligatorio",
                    "Per proteggere il tuo account, al primo accesso con questa password dovrai impostarne subito una nuova.",
                    "Se non hai richiesto tu il recupero password, accedi appena possibile e cambia la password."
            );
        else
            return buildHtmlTemplate(
                    "New temporary password",
                    "Hello, we have generated a new temporary password for your Capitally account.",
                    "Temporary password",
                    temporaryPassword,
                    "Password change required",
                    "To protect your account, on your first sign-in with this password you must set a new one immediately.",
                    "If you did not request a password reset, sign in as soon as possible and change your password."
            );
    }

    private String buildText(String temporaryPassword, String lang) {
        if (IT.equals(lang))
            return """
                Ciao,

                abbiamo generato una nuova password temporanea per il tuo account Capitally.

                Password temporanea: %s

                Accedi con questa password. Al primo accesso dovrai impostare subito una nuova password.
                """.formatted(temporaryPassword);
        else
            return """
                Hello,

                we have generated a new temporary password for your Capitally account.

                Temporary password: %s

                Sign in with this password. On your first sign-in you must immediately set a new password.
                """.formatted(temporaryPassword);
    }

    private String buildHtmlTemplate(
            String title,
            String intro,
            String passwordLabel,
            String temporaryPassword,
            String requiredTitle,
            String requiredText,
            String footer
    ) {
        return """
                <!doctype html>
                <html>
                  <body style="margin:0;background:#f3faf9;font-family:Arial,Helvetica,sans-serif;color:#08383f;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f3faf9;padding:32px 16px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #d5ece9;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(0,95,115,0.12);">
                            <tr>
                              <td style="background:#005f73;padding:28px 28px 24px;text-align:center;">
                                <img src="%s" width="56" height="56" alt="Capitally logo" style="display:inline-block;border:0;margin:0 0 12px;">
                                <div style="font-size:26px;line-height:32px;font-weight:700;color:#ffffff;">Capitally</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding:32px 28px 28px;">
                                <h1 style="margin:0 0 12px;font-size:24px;line-height:30px;color:#005f73;">%s</h1>
                                <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#24484d;">%s</p>

                                <div style="border:1px solid #bfe3df;background:#f6fbfa;border-radius:14px;padding:18px;margin:0 0 20px;">
                                  <div style="margin:0 0 8px;font-size:13px;line-height:18px;font-weight:700;color:#005f73;text-transform:uppercase;">%s</div>
                                  <div style="font-family:'Courier New',Courier,monospace;font-size:24px;line-height:30px;font-weight:700;letter-spacing:1px;color:#041e0a;word-break:break-all;">%s</div>
                                </div>

                                <div style="border-left:4px solid #005f73;background:#e9f7f5;border-radius:10px;padding:16px 18px;margin:0 0 22px;">
                                  <p style="margin:0 0 6px;font-size:15px;line-height:22px;font-weight:700;color:#005f73;">%s</p>
                                  <p style="margin:0;font-size:15px;line-height:22px;color:#24484d;">%s</p>
                                </div>

                                <p style="margin:0;font-size:13px;line-height:20px;color:#607b80;">%s</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
                """.formatted(logoUrl(), title, intro, passwordLabel, temporaryPassword, requiredTitle, requiredText, footer);
    }

    private String logoUrl() {
        return StringUtils.hasText(properties.getLogoUrl()) ? properties.getLogoUrl() : DEFAULT_LOGO_URL;
    }
}
