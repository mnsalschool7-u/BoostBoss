# Pequod redesign and ShipSmart

## Run and verify

Use Node 20 or newer. Run `npm ci`, then `npm start`.
Open `http://localhost:3000/`, `/shipsmart/`, or `/demo/llamaparse/`.
If port 3000 is occupied, use `PORT=3117 npm start`.
Run `npm test` for ranking, deadline, dimensional weight, and fee tests.
Run `npm run build` to package the public site into `dist`.
No new runtime dependency is needed. Existing classification credentials stay server side.

## Scope and audit

The public homepage and classification workspace are the active Pequod screens.
The login and team routes redirect home and are retained. There is no active Pequod
authentication or account dashboard to redesign. The old Grabbit orders page,
Bow Universe, and other nested projects are unrelated and are unchanged.
Ian and Matthew are absent. Shakiri remains.

The old homepage repeated large rounded cards, alternating section backgrounds,
large tightly tracked text, and decorative effects. The new design uses an ivory
canvas, navy ink, a restrained green accent, editorial product rows, a consistent
navigation hierarchy, and compact controls. The shared primitives are in
`design.css`. The classification compatibility layer is `workspace.css`;
all existing parser element IDs and API calls remain intact.

Reference review: [Linear](https://linear.app/), [Ramp](https://ramp.com/),
[Vercel](https://vercel.com/), [Framer](https://www.framer.com/design/), and
[Stripe](https://stripe.com/). These informed hierarchy and product navigation,
not copied assets or layouts. No Framer project or configured Higgsfield key was
found. Native CSS transitions respect reduced motion. No paid visual service
or React migration was introduced.

## ShipSmart behavior

ShipSmart is a functional manual comparison tool. It does not fetch carrier rates
or purchase labels. No EasyPost or Shippo credentials were configured. Users may
enter actual quotes from UPS, FedEx, USPS, Etsy, Pirate Ship, or another provider.
Each result displays its provenance: user entered quote, estimate, or illustrative
sample. Arrival is an entered expectation, never a verified guarantee.

The historical demo loads Stafford 22554 to Las Vegas 89135, three stone urns,
approximately 24 lb product weight, ship date November 20, 2026, delivery before
November 24 (inclusive comparison deadline November 23), Etsy, and an illustrative
$525 order value. ALL demo rates, service arrival dates, packaging cost and fee
settings are illustrative. Packed measurements are deliberately blank.
Start a new shipment to enter actual quotes. Editing shipment inputs clears old
quotes to avoid applying prices to a different parcel. Quotes exist in memory
only and disappear on refresh. No shipment inputs are sent to a third party.

Eligible options are sorted by price. Savings compare the cheapest eligible
option with the most expensive eligible option entered in the same comparison.
A cheap late service cannot win. An arrival before the ship date is rejected.
No qualifying quote produces an honest empty state.

Fee formula:
`charge = (label + packaging + allocated fixed fees) / (1 - marketplace rate - processing rate - margin)`
The result rounds up to cents. All fee inputs are editable and default to zero
outside the demo. Margin is a percentage of the shipping charge, not markup on
cost. This covers the shipping portion only, not total order profitability.
Users must account separately for taxes, advertising, currency fees and product
costs. Fixed fees must not be counted twice.

Dimensional weight is illustrative using an editable divisor (default 139).
Actual carrier rules and rounding may vary. Missing measurements are flagged;
the tool does not invent a precise box size. One parcel per comparison is
supported, with item count for packaging context.

## Later live rate integration

Add a server route with validated parcel dimensions, packed weight, actual
origin/destination address information required by the provider, and ship date.
Keep the rate provider credential in server environment variables. Return the
carrier quote ID, total, currency, expiry, service, arrival estimate and source.
Require current dates and complete measurements before requesting rates.
Never label estimates as guaranteed delivery. Keep manual Etsy/Pirate Ship
quotes available and do not imply access to marketplace negotiated rates.
No untested live rate endpoint or fake API fallback is included.

## Deployment and remaining limitations

Render's existing static service runs `npm run build`. The existing parser
backend is unchanged. The browser classification workflow continues to use its
existing deployed parser URL. New UI behavior can be reviewed without spending
parser credits. This redesign does not change classification accuracy or validate
existing legal/tariff analysis. Live shipping rates require a separate configured
provider and integration; they are not part of the current manual comparison mode.

