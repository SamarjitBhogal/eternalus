/** Where the invariant finds an ability's cooldown; the loaded ability catalogue satisfies it. */
export type CooldownSource = { get(id: string): { readonly cooldownTicks: number } };
