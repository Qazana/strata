# Code review: 16 October 2026

Reviewed commit `e8616eb5f253d87dd3b3a821fbe6a5f32b6490cb`. The review covered JavaScript, CSS and tokens, packaging, documentation, and component interactions. Source references below use the line numbers from that commit.

All 18 findings were fixed on 5 November 2026. See the [fixes and regression coverage](2026-11-05-release-fixes.md). The findings below preserve the original evidence.

1. **R01 (P1): Autosave stores sensitive fields when a generic name masks their ID.** [js/qazana.js:1674](../../js/qazana.js#L1674)

   `isSensitive()` checks `name || id`, so it never examines the ID of a named field. In a `data-persist` form, `<input name="number" id="creditcard">` and `<input name="code" id="cvv">` both wrote their test values to localStorage. This contradicts the documented name/id exclusion and can retain payment details. Check both identifiers independently of the storage key.

2. **R02 (P1): A lightbox deep link aborts module initialization.** [js/qazana.js:1574](../../js/qazana.js#L1574)

   Load the documented module entrypoint on a page with a matching `#lightbox=shots/0` fragment. Lightbox initialization runs immediately and calls `QZscroll.lock()` before `QZscroll` has initialized. Chromium throws `Cannot read properties of undefined (reading 'lock')`; `window.QZ` remains undefined and the registered behaviors never bind. Boot the lightbox after shared helpers initialize. The classic scripts used by the demos conceal this failure.

3. **R03 (P2): A confirmation dialog inside a modal loses keyboard control.** [js/qazana.js:843](../../js/qazana.js#L843)

   Open a modal, then activate a `data-qz-confirm` button inside it. Tab moves focus from the confirmation dialog back into the underlying modal because both document listeners process the key. Escape closes both dialogs. Only the top overlay should handle focus and dismissal; reference-counted scroll locking does not coordinate those behaviors.

4. **R04 (P2): Submit locking removes the submitter's name/value from the request.** [js/qazana.js:1793](../../js/qazana.js#L1793)

   The submit listener disables the button before the browser constructs form data. A native POST from a button with `name="action" value="publish"` sent only `title=Draft`, omitting `action=publish`. An AJAX handler using `new FormData(form, event.submitter)` has the same problem. Preserve the submitter data while blocking repeat activation.

5. **R05 (P2): Submit locking permits repeated submissions from a second button.** [js/qazana.js:1788](../../js/qazana.js#L1788)

   The behavior always locks the first submit button and never rejects another submit event. With Save and Publish buttons, clicking Publish twice emitted two submits; Save became disabled while Publish stayed enabled. Track the pending state on the form and guard all submit paths.

6. **R06 (P2): Dynamic required fields bypass validation.** [js/qazana.js:1062](../../js/qazana.js#L1062)

   Initialize a `data-validate` form, append a required input, then call `QZ.init(form)` again. Validation keeps its original field array, while `novalidate` disables the browser's fallback. Clicking Submit sent a native POST containing `requiredDynamic=` despite `checkValidity()` returning false. Resolve current controls on submission and bind newly added fields without duplicating listeners.

7. **R07 (P2): Selecting a date does not reach autosave or other input listeners.** [js/qazana.js:256](../../js/qazana.js#L256)

   The picker changes `input.value` without emitting `input` or `change`. Inside a `data-persist` form, clicking a day filled the date but created no stored draft. A refresh loses the selection unless another edit triggers a snapshot. Emit the appropriate bubbling events after the selection.

8. **R08 (P2): Site styling turns confirmation overlays into ordinary page content.** [kits/site.css:20](../../kits/site.css#L20)

   On `<body class="site">`, `.site > *` overrides the shared confirmation dialog's fixed position and stacking level. With only the site kit loaded, opening a confirmation produced `position:relative`, `z-index:1`, and a scroll jump to the dialog at the bottom of the page. Body scrolling then locked without a viewport scrim. Scope the layout rule so it leaves body-level overlays alone.

9. **R09 (P2): The commerce quick-view depends on unpublished demo CSS.** [kits/commerce.css:315](../../kits/commerce.css#L315)

   The kit styles `.quickview` but omits its required `.modal-scrim` rules. Those rules exist inline in `demo/commerce/product.html`. With tokens, site.css, commerce.css, and qazana.js, opening a quick-view leaves its container in normal flow with a transparent background while locking body scrolling. Ship the scrim styles with the kit and test without the demo patch.

10. **R10 (P2): The reply composer clips its canned-reply menu.** [kits/support.css:124](../../kits/support.css#L124)

    `.composer { overflow:hidden }` clips the upward-opening `.macro-menu` in the actual ticket demo on desktop and mobile. The first option's center lies outside the composer; hit-testing there reaches the page wrapper instead of the button. Let the menu escape the clipping boundary.

11. **R11 (P2): Range controls have no visible focus indicator in forced colors.** [kits/app.css:203](../../kits/app.css#L203), [dual slider rule:1021](../../kits/app.css#L1021)

    The slider rules override the base forced-colors outline with `outline:none`. Their replacement thumb shadows disappear in forced-colors mode. Ordinary and dual sliders produced byte-identical screenshots before and after keyboard focus in Chromium, although `:focus-visible` matched. Restore an outline that survives these kit rules.

12. **R12 (P2): Billing dialogs cannot scroll on short screens.** [kits/billing.css:248](../../kits/billing.css#L248)

    At a 390 by 568 viewport, the cancellation dialog measured about 617 pixels tall and extended beyond both viewport edges. The fixed scrim centers it without a scroll region, while the modal behavior locks body scrolling. Wheel input cannot reveal the clipped footer. Bound the dialog height or make the scrim scrollable without losing the top edge.

13. **R13 (P2): Variant initialization replaces the authored selection.** [js/qazana.js:1213](../../js/qazana.js#L1213)

    Given S unchecked and M checked in the markup, initialization selects S because it checks only whether the first enabled option is selected. This silently changes the customer's preselected variant. Preserve an existing enabled selection and set its tab stop accordingly.

14. **R14 (P2): Arrow navigation throws when every variant is unavailable.** [js/qazana.js:1210](../../js/qazana.js#L1210)

    A group whose options all have `aria-disabled="true"` still gives the first option a tab stop. Pressing ArrowRight then dereferences an undefined destination and throws `Cannot set properties of undefined (setting 'tabIndex')`. Handle the empty enabled-option list before moving focus.

15. **R15 (P2): Module consumers do not receive the promised compatibility globals.** [js/qazana.js:1980](../../js/qazana.js#L1980)

    A normal module load publishes `window.QZ`, but leaves `QZstore`, `QZi18n`, `QZcal`, `QZscroll`, `QZq`, and `QZready` undefined on window. Their `QZ` aliases work. The API contract explicitly preserves the historical names, so consumers using them fail after adopting the documented module entrypoint. Export the compatibility aliases explicitly.

16. **R16 (P2): Clicking the lightbox Close button leaves its URL state open.** [js/qazana.js:1489](../../js/qazana.js#L1489)

    The listener passes its MouseEvent directly to `close(fromHash)`. That truthy argument skips hash restoration. Closing a viewer leaves `#lightbox=shots/0` in the URL and refreshing reopens it; Escape restores the hash correctly. Wrap the click handler so the event is not treated as the internal flag.

17. **R17 (P2): Focus escapes a single-item lightbox.** [js/qazana.js:1536](../../js/qazana.js#L1536)

    The focus trap includes hidden Prev and Next buttons. With one image, Shift+Tab from Close moves into the background page; the reproduction landed on the demo footer's GitHub link. Build the focus loop from visible, enabled controls.

18. **R18 (P2): The vanilla installation example uses URLs that browsers cannot resolve.** [vanilla.md:16](../../docs-site/src/content/docs/getting-started/vanilla.md#L16)

    Literal `href="@qazana/strata/tokens"` and `src="@qazana/strata"` resolve as relative HTTP paths, not npm exports. Copying this example into a plain HTML project leaves the styles and behavior unloaded. Show actual vendored paths or versioned CDN URLs. README and other installation examples repeat the same pattern.

Validation at the reviewed commit: `npm run test` passed all 4 contract checks and 44 behavior/state checks. Axe reported no serious or critical violations across 22 page/scheme runs. The focus harness passed 3,162 stops across 54 pages in two schemes. The docs build passed in an isolated copy, and the package dry-run contained all exported assets. These checks do not cover the failing cases above. Browser reproductions used Chromium; Firefox, WebKit, and screen readers were not tested.

To reproduce the browser findings, serve the repository with `npm run demo` and open the relevant demo under `http://localhost:4178/demo/`. For cases without matching demo markup, use a local HTML fixture that loads `tokens/qazana.tokens.css`, the required kit, and `js/qazana.js`. Use `type="module"` for R02 and R15. Call `QZ.init(fixture)` when adding markup after load. R08 and R09 need only the published kit CSS; demo-specific inline styles mask those defects. Use synthetic values for R01.

The review used temporary browser probes. Their observed results are recorded above; the probes are not part of the regression suite. Each fix should add a lasting check for its failing case.
