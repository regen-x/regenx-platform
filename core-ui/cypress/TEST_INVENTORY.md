# RegenX Critical Flow Inventory

This inventory defines the end-to-end journeys covered by the local Cypress validation pass and the expected state transitions that must stay visible to users.

## Investor Happy Path

Route flow:
- `/auth/sign-up`
- `/auth/sign-in`
- `/account-verification`
- `/opportunities`
- `/project/:id`
- `/orders`
- `/transactions`
- `/portfolio`
- `/distributions`

Expected state transitions:
- Authentication: `anonymous -> signed_up -> authenticated investor`
- Verification: `not_started -> verification_started`
- Investment intent: `project viewed -> trustline_ready -> signed_purchase_submitted`
- Order lifecycle: `PENDING_SIGNATURE/SUBMITTED -> SETTLING -> COMPLETED`
- Ledger: completed buy transaction recorded with investor reference
- Ownership: holdings row present with updated units
- Income: distribution row visible when project has a paid record

Expected visible outcomes:
- Sign-up and sign-in CTAs submit successfully
- Sumsub verification CTA is visible on account verification
- Opportunity list renders and project CTA is available
- Project buy CTA becomes available after trustline readiness
- Orders page shows the created order and completed state
- Transactions page shows the matching reference
- Portfolio shows the investor position
- Distributions shows the paid income record when applicable

## Investor Order Failure Path

Route flow:
- `/auth/sign-in`
- `/project/:id`

Expected state transitions:
- `authenticated investor -> trustline_ready -> signed_purchase_failed`
- No completed order, transaction, or ownership mutation is assumed after failure

Expected visible outcomes:
- Project route loads
- Buy CTA is visible
- Failure feedback is shown when signed transfer submission fails

TODO:
- The current invest flow uses transient toast feedback on submission failure. Keep a persistent inline retry banner in the modal once the purchase UX supports it cleanly.

## Secondary Market Sell Order Path

Route flow:
- `/auth/sign-in`
- `/offers`
- `My Offers`
- `/transactions`
- `/portfolio`

Expected state transitions:
- Holdings available -> sell order created
- Offer lifecycle: `LIVE -> FILLED`
- Ledger: sell transaction recorded
- Ownership: remaining units reduced after fill simulation

Expected visible outcomes:
- Sell order CTA is visible
- New offer appears in `My Offers`
- Filled state is visible after simulated fill
- Transaction row appears for the sell reference
- Portfolio reflects reduced ownership

## Developer Visibility Path

Route flow:
- `/auth/sign-in`
- `/dashboard`
- `/project/:id`
- `/investors`
- `/developer-transactions`

Expected state transitions:
- `authenticated developer -> project visible -> investor ledger visible`
- Capital raised values remain internally consistent across views

Expected visible outcomes:
- Dashboard route loads with developer project context
- Project page renders the same raised capital shown elsewhere
- Investors list shows participants and capital raised
- Developer transactions show the same inflow total and transaction reference
