# Budget Boss Feature Backlog & Ideas

This document lists prospective product features, extensions, and ideations for
the Budget Boss app (`BudgetBITCH` repo). Nothing here is shipped — see
`docs/CODEBASE_INDEX.md` for what actually exists.

---

## 1. Onboarding Personas & Situational Wizards

Provide dedicated onboarding flows and starting setups customized for different user situations:

- **Youth & Singles**:
  - Single Teen (with Female/Male selection)
  - Young Adult (with Female/Male selection)
  - Young Entrepreneur
  - Homeless Transition Aid (simplified zero-base tracking)
- **Couples & Families**:
  - New Couple
  - Couple with Pets
  - Family
  - Family with Pets
- **Alternative & Specialized Roles**:
  - Widow/Widower
  - Investor
  - Philanthropist

### Dynamic Regional Constraints
- **Country & State Specific Setup**: When a wizard is activated, fetch dynamic regional data (tax brackets, rent index, average utilities cost) from web APIs based on the user's location to pre-populate blueprint assumptions.

---

## 2. Smart "Learn!" Financial Guides

Create intuitive, engaging, and humorous micro-learning guides composed of silly use cases to explain complex financial topics:

- **How does interest work?**
  - *Scenario*: Someone tears off their finger to lend it to you (so much blood...). You are thankful and agree to return a whole hand to them within a certain time. If you take too long, they take your other hand and your head...
- **Topics to Cover**:
  - Budgeting (Envelope vs zero-sum)
  - Investing basics
  - Bitcoin & Cryptocurrencies
  - NFTs
  - Gold & Commodities
  - Equity & Shares
  - Oil
  - Labour value & wages

---

## 3. Job Listings Module

Integrate a local opportunities finder or jobs listings panel in the dashboard to help users find ways to plug immediate budget gaps:

- Fetch gig/freelance or full-time opportunities.
- Sort listings based on distance, payment speed (daily/weekly), and required skill levels.
- Direct quick-apply integrations.

---

## 4. Deep Integrations

Expand data tracking capability to hook into external sources for automatic,
privacy-first balance aggregation.

**Constraint:** Budget Boss is a free app. Paid bank-aggregation vendors
(Plaid, MX, Yodlee, etc.) and any paid-API connector are out of scope. Only
free/self-hosted or user-supplied-credential paths are acceptable:

- Free/open banking APIs where the user supplies their own credentials
- User-exported statement imports (CSV/OFX) — extends the existing CSV importer
- Bank SMS parsing (already shipped: `src/lib/sms-parser/**`)
- Custom third-party import modules the user configures themselves
