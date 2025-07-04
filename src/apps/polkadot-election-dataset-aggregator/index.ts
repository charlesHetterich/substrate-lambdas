import { App, Config, Observables } from "@lambdas/app-support";
import { aggData } from "./aggData";

const description = `
Once per day, aggregates election snapshots & results into a Huggingface Dataset. Each time this triggers we capture the current "snapshot" (today's sample) and "results" (yesterday's label).

Data is downloaded locally, uploaded to Huggingface, and then deleted from local.
`;

export default App([Config.Description(description)], {
    /**
     * Triggers when `Signed` phase begins. This should trigger once per era.
     */
    watching:
        Observables.event.polkadot.ElectionProviderMultiPhase.PhaseTransitioned(),
    trigger: (transition, c) => {
        return transition.to.type == "Signed";
    },

    /**
     * Aggregate snapshot data
     */
    lambda: (_, c) => {
        aggData(c.apis.polkadot);
    },
});
