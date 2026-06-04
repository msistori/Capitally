import { LegalDocument } from '../legal-document.model';

export const COOKIES_EN: LegalDocument = {
  "title": "Cookie Policy",
  "updatedAt": "1 June 2026",
  "intro": [
    "This Cookie Policy explains which cookies and similar technologies Capitally uses and how you can manage your preferences.",
    "Capitally uses tools needed for the app to work and analytics only with prior consent. It does not use advertising or marketing cookies."
  ],
  "sections": [
    {
      "title": "1. What cookies and similar technologies are",
      "paragraphs": [
        "Cookies are small files saved by a website in the user’s browser. Similar technologies, such as browser storage, allow certain information to be stored in the browser to make the website work or remember preferences."
      ]
    },
    {
      "title": "2. Necessary tools",
      "paragraphs": [
        "Capitally uses technical tools needed for login, session, security, basic preferences and proper operation of the app. Without these tools, some features may not be available.",
        "These tools do not require prior consent, but they are described in this notice."
      ]
    },
    {
      "title": "3. Preferences",
      "paragraphs": [
        "Capitally may save preferences such as language, default currency and privacy choice, so users do not have to set them again on each visit.",
        "This information is not used for advertising or marketing profiling."
      ]
    },
    {
      "title": "4. Analytics",
      "paragraphs": [
        "Capitally uses PostHog to collect general statistics on app usage only after the user gives consent.",
        "Analytics do not include amounts, transaction descriptions, account names or CSV contents. They only concern general app actions, such as page views, successful login or use of features.",
        "The user can accept, reject or change this choice from the site’s privacy preferences."
      ]
    },
    {
      "title": "5. Marketing and advertising",
      "paragraphs": [
        "Capitally does not use advertising cookies, marketing pixels or commercial profiling tools.",
        "If such tools are introduced in the future, the Cookie Policy and consent system will be updated before activation."
      ]
    },
    {
      "title": "6. Summary of technologies used",
      "table": {
        "headers": [
          "Category",
          "Purpose",
          "Consent"
        ],
        "rows": [
          [
            "Necessary",
            "Account access, session, security and app operation",
            "No"
          ],
          [
            "Preferences",
            "Saving language, currency and privacy choice",
            "No"
          ],
          [
            "Analytics",
            "General usage statistics through PostHog",
            "Yes"
          ],
          [
            "Marketing",
            "Advertising, profiling or retargeting",
            "Not used"
          ]
        ]
      }
    },
    {
      "title": "7. Third-party services",
      "paragraphs": [
        "In production, technical providers such as hosting, CDN, logging, monitoring or analytics providers may process technical data needed for the website to work, such as IP address and browser information."
      ],
      "items": [
        "Railway",
        "PostHog, only for analytics with prior consent"
      ]
    },
    {
      "title": "8. How to manage cookies and browser data",
      "paragraphs": [
        "You can delete cookies, browser storage and other site data from your browser settings.",
        "Deleting technical data may log you out, remove saved preferences or require you to express your analytics choice again."
      ]
    },
    {
      "title": "9. Contacts",
      "paragraphs": [
        "For questions about cookies and similar technologies, you can write to support@capital-ly.com."
      ]
    }
  ]
};
