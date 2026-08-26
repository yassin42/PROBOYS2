'use server';
/**
 * @fileOverview An AI agent that provides cross-compatibility suggestions for inventory parts.
 *
 * - suggestPartCompatibility - A function that suggests compatible models for a given part.
 * - PartCompatibilityInput - The input type for the suggestPartCompatibility function.
 * - PartCompatibilityOutput - The return type for the suggestPartCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PartCompatibilityInputSchema = z.object({
  partName: z.string().describe('The name of the inventory part (e.g., OLED Screen, Charging Flex).'),
  modelName: z.string().describe('The primary phone model this part is associated with (e.g., iPhone 15 Pro, Galaxy S23 Ultra).'),
  description: z.string().optional().describe('An optional detailed description of the part.'),
  existingCompatibilityNotes: z.string().optional().describe('Any existing cross-compatibility notes for the part.'),
});
export type PartCompatibilityInput = z.infer<typeof PartCompatibilityInputSchema>;

const PartCompatibilityOutputSchema = z.object({
  suggestedCompatibleModels: z.array(z.string()).describe('A list of phone models that are suggested to be cross-compatible with the given part.'),
  rationale: z.string().describe('An explanation for the suggested compatible models, detailing why they are compatible.'),
});
export type PartCompatibilityOutput = z.infer<typeof PartCompatibilityOutputSchema>;

export async function suggestPartCompatibility(input: PartCompatibilityInput): Promise<PartCompatibilityOutput> {
  return suggestPartCompatibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'partCompatibilityPrompt',
  input: {schema: PartCompatibilityInputSchema},
  output: {schema: PartCompatibilityOutputSchema},
  prompt: `You are an expert in phone repair and parts cross-compatibility. Your task is to analyze a given inventory part and suggest other phone models that might be compatible with it.

Consider the following details about the part:
Part Name: {{{partName}}}
Primary Model: {{{modelName}}}
{{#if description}}Description: {{{description}}}{{/if}}
{{#if existingCompatibilityNotes}}Existing Compatibility Notes: {{{existingCompatibilityNotes}}}{{/if}}

Based on your extensive knowledge of phone components, material specifications, and design similarities across different brands and models, identify phone models that could potentially use this part.

Provide a list of suggested compatible models and a detailed rationale explaining the basis for each suggestion or the overall compatibility. If no obvious compatibility exists beyond the primary model, state that and explain why.

Example Output Format:
{
  "suggestedCompatibleModels": ["Samsung A13", "Samsung M15"],
  "rationale": "The OLED screen for the iPhone 15 Pro is highly specialized and generally not cross-compatible with other models due to proprietary connectors and display dimensions. However, some minor components like certain screws or adhesive strips might be generic. For the given part, no direct cross-model screen compatibility is identified."
}`,
});

const suggestPartCompatibilityFlow = ai.defineFlow(
  {
    name: 'suggestPartCompatibilityFlow',
    inputSchema: PartCompatibilityInputSchema,
    outputSchema: PartCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
