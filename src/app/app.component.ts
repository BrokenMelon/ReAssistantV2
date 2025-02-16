import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatFormField} from '@angular/material/form-field';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {MatInput} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatList, MatListItem, MatListOption, MatSelectionList} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {OpenAiService} from '../service/open-ai.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, MatButton, MatIcon, MatFormField, MatCard, MatInput, CommonModule,
    FormsModule, MatList, MatListItem, MatCardHeader, MatCardContent, MatSelectionList, MatListOption, MatProgressSpinner, MatSlideToggle
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  parsedRequirements: string[] = [];
  parsedRequirementsLoading = false;
  generifiedRequirements: string[] = [];
  generifiedFunctionalRequirements: string[] = [];
  generifiedNonFunctionalRequirements: string[] = [];
  generifiedRequirementsLoading = false;
  productDescription = "";
  generatedRequirements: string[] = [];
  generatedRequirementsLoading = false;
  selectedRequirements: string[] = [];
  sortToggleButton = false;
  reusableRequirements: string[] = [];
  reusableRequirementsLoading = false;
  nonReusableRequirements: string[] = [];
  nonReusableRequirementsLoading = false;
  #openAiService = inject(OpenAiService);

  public async parseRequirements(event: any): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.parsedRequirements = [];

    if (input.files) {
      const parser = new DOMParser();

      for (const file of Array.from(input.files)) {
        const xmlString = await file.text();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const textBodies = xmlDoc.getElementsByTagName("text_body");

        const newRQs = Array.from(textBodies).map((element) => element.textContent?.trim() || "");
        this.parsedRequirements.push(...newRQs);
      }
    }
    console.log(`${this.parsedRequirements.length} RQs Parsed.`);
  }

  public async generateRequirements() {
    this.generatedRequirementsLoading = true;
    const json = await this.#openAiService.callOpenAi(
      "GENERATE",
      this.productDescription.split("\n")
    );
    this.generatedRequirements = json.generatedRequirements;
    this.generatedRequirementsLoading = false;
  }

  public async generalizeAndCategorizeRequirementsParallel() {
    this.generifiedRequirementsLoading = true;

    const chunks: string[][] = [];
    for (let i = 0; i < this.parsedRequirements.length; i += 15) {
      chunks.push(this.parsedRequirements.slice(i, i + 15));
    }

    const generifiedChunks = await Promise.all(
      chunks.map((chunk) => this.generalizeRequirementsChunk(chunk))
    );
    this.generifiedRequirements = generifiedChunks.flat();

    console.log(`${this.generifiedRequirements.length} RQs Generified.`);

    const generifiedChunksForCategorization: string[][] = [];
    for (let i = 0; i < this.generifiedRequirements.length; i += 15) {
      generifiedChunksForCategorization.push(this.generifiedRequirements.slice(i, i + 15));
    }

    const categorizedChunks = await Promise.all(
      generifiedChunksForCategorization.map((chunk) => this.categorizeRequirementsChunk(chunk))
    );

    this.generifiedFunctionalRequirements = categorizedChunks.flatMap(chunk => chunk.functionalRequirements);
    this.generifiedNonFunctionalRequirements = categorizedChunks.flatMap(chunk => chunk.nonFunctionalRequirements);

    console.log(`RQs Categorized. Functional: ${this.generifiedFunctionalRequirements.length}, Non-Functional: ${this.generifiedNonFunctionalRequirements.length}`);

    this.generifiedRequirementsLoading = false;
  }

  public async processRequirementsParallel() {
    this.reusableRequirementsLoading = true;
    this.nonReusableRequirementsLoading = true;

    let result = (await Promise.all(
      this.selectedRequirements.map((rq) => this.processRequirement(rq))
    ));

    this.reusableRequirements = result
      .filter(([_, reusable]) => reusable)
      .map(([rq, _]) => rq)

    this.nonReusableRequirements = result
      .filter(([_, reusable]) => !reusable)
      .map(([rq, _]) => rq)

    console.log(`RQs Processed. Reusable: ${this.reusableRequirements.length}, Non-Reusable: ${this.nonReusableRequirements.length}`)

    this.nonReusableRequirementsLoading = false;

    await this.sortReusableRequirementsParallel(this.sortToggleButton);
  }

  public async sortReusableRequirementsParallel(ordered: boolean): Promise<void> {
    this.reusableRequirementsLoading = true;

    if (ordered) {
      const ratedRequirements = await Promise.all(
        this.reusableRequirements.map(async (rq) => await this.rateRequirement(rq))
      );

      this.reusableRequirements = ratedRequirements
        .sort((a, b) => a[1] - b[1])
        .map(a => a[0])
    }

    this.reusableRequirementsLoading = false;
  }

  private async generalizeRequirementsChunk(parsedRequirements: string[]): Promise<string[]> {
    const json = await this.#openAiService.callOpenAi(
      "GENERALIZE",
      parsedRequirements
    );
    return json.generifiedRequirements
  }

  private async categorizeRequirementsChunk(generifiedRequirements: string[]) {
    const json = await this.#openAiService.callOpenAi(
      "CATEGORIZE",
      generifiedRequirements
    );
    return {
      functionalRequirements: json.functionalRequirements,
      nonFunctionalRequirements: json.nonFunctionalRequirements,
    }
  }

  private async processRequirement(requirement: string): Promise<[string, boolean]> {
    const json = await this.#openAiService.callOpenAi(
      "PROCESS",
      this.generifiedFunctionalRequirements.concat(this.generifiedNonFunctionalRequirements),
      requirement
    );
    console.log([requirement, json])
    return [requirement, !!json.reusable];
  }

  private async rateRequirement(requirement: string): Promise<[string, number]> {
    const result = await this.#openAiService.callOpenAi(
      "RATE",
      this.generifiedFunctionalRequirements.concat(this.generifiedNonFunctionalRequirements),
      requirement
    );
    return [requirement, result.similarity];
  }
}
