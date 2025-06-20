import * as D from "@polkadot-api/descriptors";
import { ChainDefinition, TypedApi } from "polkadot-api";

// TODO! How to make this hard-coded list
//       less fragile against PAPI updates?
const RELAYS = [
    "polkadot",
    "ksmcc3",
    "westend2",
    "paseo",
    "rococo_v2_2",
] as const;

/**
 * Set of Id's for all chains with available descriptors
 */
export type ChainId =
    | {
          [K in keyof typeof D]: (typeof D)[K] extends ChainDefinition
              ? K
              : never;
      }[keyof typeof D];

/**
 * Set of Id's for all relay chains with available descriptors.
 *
 * A subset of `ChainId`.
 */
export type RelayId = ChainId & (typeof RELAYS)[number];

/**
 * All chains with available descriptors. (Real value equivalent of `ChainId` set)
 */
export const knownChains: ChainId[] = (
    Object.keys(D) as (keyof typeof D)[]
).filter(
    (k): k is ChainId =>
        typeof (D as any)[k] === "object" && "descriptors" in (D as any)[k]
);

/**
 * All relay chains with available descriptors. (Real value equivalent of `RelayId` set)
 */
export const knownRelays: RelayId[] = knownChains.filter((id): id is RelayId =>
    (RELAYS as readonly string[]).includes(id)
);

/**
 * Convert a `ChainId` string to a `VirtualChainId`
 *
 * Transforms snake case variable names to camel case, to be more typescript idiomatic.
 * (ex: `polkadot_asset_hub` → `polkadotAssetHub`)
 */
export type ToVirtual<S extends string> =
    S extends `${infer Head}_${infer Tail}`
        ? Tail extends `${number}${string}`
            ? `${Head}_${ToVirtual<Tail>}`
            : `${Head}${Capitalize<ToVirtual<Tail>>}`
        : S;

/**
 * Expose a `VirtualChainId` set for chain selection in apps
 */
export type VirtualChainId = ToVirtual<ChainId>;

/**
 * Convert a `ChainId` to a `VirtualChainId`
 */
export function toVirtual(chainId: ChainId): VirtualChainId {
    return chainId.replace(/_([a-z])/g, (_, ch) =>
        ch.toUpperCase()
    ) as VirtualChainId;
}

/**
 * Convert a `VirtualChainId` to a `ChainId`
 */
export type FromVirtual<V extends VirtualChainId> = {
    [K in ChainId]: V extends ToVirtual<K> ? K : never;
}[ChainId];

/**
 * Convert a `ChainId` to its corresponding `TypedApi`
 */
export type ToApi<C extends ChainId> = {
    [K in keyof typeof D]: (typeof D)[K] extends ChainDefinition
        ? TypedApi<(typeof D)[K]>
        : never;
}[C];

/**
 * Check if `chainId` is the Id of a relay chain
 */
export function isRelay(chainId: ChainId): boolean {
    return chainId in knownRelays;
}

/**
 * Get the relay chainId for a given chain ID
 */
export function getRelayId(chainId: ChainId): RelayId {
    const relayId = knownRelays.find((relay) => chainId.startsWith(relay));
    if (!relayId) {
        throw new Error(`No relay found for chainID: ${chainId}`);
    }
    return relayId;
}

if (import.meta.vitest) {
    const { test, expect, expectTypeOf } = import.meta.vitest;

    test("`knownChains` & `ChainId` should contain the variable names of all available chain descriptors", () => {
        expect(knownChains).toContain("polkadot");
        expect(knownChains).toContain("polkadot_asset_hub");
        expect(knownChains).toContain("rococo_v2_2");
        expectTypeOf<
            "polkadot" | "polkadot_asset_hub" | "rococo_v2_2"
        >().toExtend<ChainId>();
    });

    test("`knownRelays` & `RelayId` should contain variable names of available relay chains, but not parachains", () => {
        expect(knownRelays).toContain("polkadot");
        expect(knownRelays).toContain("rococo_v2_2");
        expect(knownRelays).not.toContain("polkadot_asset_hub");
        expectTypeOf<"polkadot" | "rococo_v2_2">().toExtend<RelayId>();
        expectTypeOf<"polkadot_asset_hub">().not.toExtend<RelayId>();
    });

    test("`knownChains` should exclude non descriptors from `@polkadot-api/descriptors`", () => {
        expect(knownChains).not.contain("DispatchClass");
        expect(knownChains).not.contain("BagsListListListError");
    });

    test("`ToVirtual` & `toVirtual` convert snake cased chain ids to camel case", () => {
        expectTypeOf<ToVirtual<"polkadot">>().toEqualTypeOf<"polkadot">();
        expectTypeOf<
            ToVirtual<"polkadot_asset_hub">
        >().toEqualTypeOf<"polkadotAssetHub">();
        expectTypeOf<ToVirtual<"rococo_v2_2">>().toEqualTypeOf<"rococoV2_2">();

        expect(toVirtual("polkadot")).toEqual("polkadot");
        expect(toVirtual("polkadot_asset_hub")).toEqual("polkadotAssetHub");
        expect(toVirtual("rococo_v2_2")).toEqual("rococoV2_2");
    });

    test("`FromVirtual` convert camel case virtual ids back to their original chain ids", () => {
        expectTypeOf<FromVirtual<"polkadot">>().toEqualTypeOf<"polkadot">();
        expectTypeOf<
            FromVirtual<"polkadotAssetHub">
        >().toEqualTypeOf<"polkadot_asset_hub">();
        expectTypeOf<
            FromVirtual<"rococoV2_2">
        >().toEqualTypeOf<"rococo_v2_2">();
    });

    test("`ToAPI` converts a `ChainId` to its corresponding `TypedApi`", () => {
        expectTypeOf<ToApi<"polkadot">>().toEqualTypeOf<
            TypedApi<typeof D.polkadot>
        >();
    });
}
