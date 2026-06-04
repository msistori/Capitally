import { LegalDocument } from '../legal-document.model';

export const PRIVACY_EN: LegalDocument = {
  "title": "Privacy Policy",
  "updatedAt": "1 June 2026",
  "intro": [
    "This Privacy Policy explains in simple terms how Capitally collects and uses users’ personal data.",
    "Capitally is a personal finance management app: it allows users to record accounts, transactions, categories, transfers, statistics and similar data voluntarily entered by the user."
  ],
  "sections": [
    {
      "title": "1. Data controller",
      "paragraphs": [
        "The data controller is Capitally.",
        "For any privacy request, you can contact support@capital-ly.com."
      ]
    },
    {
      "title": "2. Data we process",
      "paragraphs": [
        "We process only the data needed to create the account, allow access and provide the personal finance management features."
      ],
      "items": [
        "Registration and login data, such as username, email and protected password.",
        "Data entered by the user, such as accounts, currencies, categories, transactions, amounts, dates, descriptions, recurring entries, transfers and CSV imported data.",
        "App preferences, such as language, default currency and privacy preferences.",
        "Technical data needed for the operation and security of the service, such as technical logs, device/browser information and request-related data.",
        "Analytics data, only if the user gives consent, related to general app usage and not to the financial content entered."
      ]
    },
    {
      "title": "3. Financial data entered by the user",
      "paragraphs": [
        "Capitally does not automatically connect to banks, current accounts, cards or brokers. The financial data stored in the app is the data the user voluntarily enters, edits, imports or deletes.",
        "Capitally does not send amounts, transaction descriptions, account names or CSV file contents to analytics tools."
      ]
    },
    {
      "title": "4. Why we use data",
      "table": {
        "headers": [
          "Purpose",
          "Data used",
          "Legal basis"
        ],
        "rows": [
          [
            "Create and manage the account",
            "Registration, login and profile data",
            "Performance of the requested service"
          ],
          [
            "Provide the app features",
            "Accounts, categories, transactions, transfers, currencies, statistics and CSV data",
            "Performance of the requested service"
          ],
          [
            "Keep preferences and settings",
            "Language, currency and privacy preferences",
            "Performance of the service or legitimate interest"
          ],
          [
            "Protect the service and prevent abuse",
            "Technical data, logs and security information",
            "Legitimate interest in security"
          ],
          [
            "Improve the product through analytics",
            "General usage events and non-financial technical properties",
            "User consent"
          ],
          [
            "Comply with legal obligations or authority requests",
            "Data required on a case-by-case basis",
            "Legal obligation"
          ]
        ]
      }
    },
    {
      "title": "5. Analytics and consent",
      "paragraphs": [
        "Capitally uses PostHog to understand, only in general terms, how the app features are used. Analytics are disabled until the user gives consent.",
        "Analytics events concern general actions, such as successful login, page opening, settings opening, language change, creation or update of items. They do not include personal financial content such as amounts, descriptions, account names or CSV contents.",
        "The user can change this choice from the privacy preferences available on the site."
      ]
    },
    {
      "title": "6. Cookies and similar technologies",
      "paragraphs": [
        "Capitally uses cookies or similar technologies, such as browser storage, to make login work, remember some preferences and manage analytics consent.",
        "For more details, please see the Cookie Policy."
      ]
    },
    {
      "title": "7. Third-party services",
      "paragraphs": [
        "To provide the service, technical providers may be used, such as hosting, database, backup, logging, monitoring and analytics providers. These providers process data only for the purposes needed to provide the service."
      ],
      "items": [
        "Railway",
        "PostHog, only for analytics with prior consent",
        "Resend"
      ]
    },
    {
      "title": "8. Transfers outside the European Economic Area",
      "paragraphs": [
        "Some providers may process data outside the European Economic Area. In such cases, the controller verifies that appropriate safeguards required by applicable law are in place, such as adequacy decisions or standard contractual clauses.",
        "Final information depends on the providers selected for the production environment."
      ]
    },
    {
      "title": "9. How long we keep data",
      "items": [
        "Account data and data entered in the app: for the duration of the account, unless deletion is requested or legal obligations apply.",
        "Technical data and logs: for the time needed for security, maintenance and technical diagnosis (30 days)",
        "PostHog analytics data: according to the PostHog project configuration (1 year)."
      ]
    },
    {
      "title": "10. User rights",
      "paragraphs": [
        "Within the limits provided by the GDPR, users may request access, rectification, erasure, restriction, portability, objection to processing and withdrawal of consent when processing is based on consent.",
        "To exercise your rights, you can write to support@capital-ly.com. The controller may request information needed to verify the requester’s identity.",
        "Users may also lodge a complaint with the competent supervisory authority."
      ]
    },
    {
      "title": "11. Security",
      "paragraphs": [
        "Capitally adopts reasonable technical and organizational measures to protect accounts and data entered by users, including authentication, password protection and access controls for reserved areas.",
        "No online service can guarantee absolute security: users must keep their credentials safe and use updated devices."
      ]
    },
    {
      "title": "12. Changes to this Privacy Policy",
      "paragraphs": [
        "This Privacy Policy may be updated in case of changes to the service, providers or applicable law.",
        "The last updated date identifies the version currently published."
      ]
    },
    {
      "title": "13. Contacts",
      "paragraphs": [
        "For privacy requests or information about personal data processing: support@capital-ly.com."
      ]
    }
  ]
};
