import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import {PromptConfig} from '../app/promp-config';
import {parseJson} from '@angular/cli/src/utilities/json-file';

const API_KEY = "";
const openai = new OpenAI({apiKey: API_KEY, dangerouslyAllowBrowser: true});
const DEBUG = true;

export type Task = "GENERATE" | "CATEGORIZE" | "GENERALIZE" | "PROCESS" | "RATE"

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {

  private async callInternal(model: string, systemPrompt: string, userPrompt: string): Promise<any> {
    return await openai.chat.completions.create({
      temperature: 0.2,
      model,
      response_format: {"type": "json_object"},
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
    });
  }

  public async callOpenAi(task: Task, requirements: string[], newRequirement?: string) {
    let startDate;

    if (DEBUG) {
      console.log("DEBUGGING FOR TASK: ", task)
      console.log("Input Requirements length: ", requirements.length)
      if (newRequirement && task === "PROCESS")
        console.log("For RQ: ", newRequirement);

      startDate = Date.now()
    }

    let systemPrompt = "";
    let userPrompt = `Here are the Requirements: ${requirements}`
    switch (task) {
      case "GENERATE":
        systemPrompt = PromptConfig.systemPrompts.generateRequirements;
        break;
      case "CATEGORIZE":
        systemPrompt = PromptConfig.systemPrompts.categorizeRequirements;
        break;
      case "GENERALIZE":
        systemPrompt = PromptConfig.systemPrompts.generalizeRequirements;
        break;
      case "PROCESS":
        systemPrompt = PromptConfig.systemPrompts.processRequirement;
        userPrompt =
          `THIS IS THE NEW REQUIREMENT: "${newRequirement}".

          THESE ARE THE OLD REQUIREMENTS:
          ${requirements}.

          IS THERE A REUSABLE REQUIREMENT IN THE OLD ONES?`
        break;
      case "RATE":
        systemPrompt = PromptConfig.systemPrompts.sortRequirements;
        userPrompt =
          `THIS IS THE NEW REQUIREMENT: "${newRequirement}".

          THESE ARE THE OLD REQUIREMENTS:
          ${requirements}.`
        break;
    }

    const resp = parseJson((await this.callInternal(PromptConfig.model, systemPrompt, userPrompt))
      .choices[0]
      .message
      .content!!)

    if (DEBUG)
      console.log(`TASK: ${task} took ${Date.now() - startDate!!}`)

    return resp;
  }
}
