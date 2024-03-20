/*
 * -------------------------------------------------------------------------------------------------------
 * Copyright (c) Vijay Meena <vijayymmeena@gmail.com> (https://github.com/samarmeena). All rights reserved.
 * Licensed under the Apache License. See License.txt in the project root for license information.
 * -------------------------------------------------------------------------------------------------------
 */
import type { SlashChoiceType } from "discordx";

export function EnumChoice(
  choices: Record<string, string>,
): SlashChoiceType<string, string>[] {
  return Object.keys(choices).map((key) => ({
    name: key,
    value: choices[key],
  }));
}
