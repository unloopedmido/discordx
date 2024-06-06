/*
 * -------------------------------------------------------------------------------------------------------
 * Copyright (c) Vijay Meena <vijayymmeena@gmail.com> (https://github.com/samarmeena). All rights reserved.
 * Licensed under the Apache License. See License.txt in the project root for license information.
 * -------------------------------------------------------------------------------------------------------
 */
import type { ChatInputCommandInteraction } from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";

class Document {
  constructor(
    public input: string,
    public interaction: ChatInputCommandInteraction,
  ) {
    /*
      empty constructor
    */
  }

  async save(): Promise<void> {
    /*
      your logic to save input into database
    */

    await this.interaction.followUp(
      `${this.interaction.user.toString()} saved \`${this.input}\` into database`,
    );
  }
}

function DocumentTransformer(
  input: string,
  interaction: ChatInputCommandInteraction,
): Document {
  return new Document(input, interaction);
}

@Discord()
export class Example {
  @Slash({ description: "Save input into database", name: "save-input" })
  async withTransformer(
    @SlashOption({
      description: "input",
      name: "input",
      required: true,
      transformer: DocumentTransformer,
      type: ApplicationCommandOptionType.String,
    })
    doc: Document,
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    await interaction.deferReply();
    await doc.save();
  }
}
