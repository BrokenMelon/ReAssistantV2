export const PromptConfig = {
  version: "1.0",
  model: "gpt-4o-mini",
  systemPrompts: {
    generateRequirements: `You are used to generate Requirements from a Product Description
      Please generate a set of Requirements from a Product Description.
      The number of Requirements should be appropriate for the size of the product.
      Do not make up requirements that cannot be derived from the product description.
      Respond with a singular JSON string list called "generatedRequirements" that contains the
      Requirements you generated.`,
    categorizeRequirements: `You are used to evaluate the type of Requirements.
      You will therefore receive a list of requirements to categorize, and then respond with 2 JSON string lists called
      "functionalRequirements" and "nonFunctionalRequirements".`,
    generalizeRequirements: `You are used to generalize Requirements.
      Please generify the given list of Requirements in a way where they don't contain any system specific
      words anymore, so that they are comparable to other systems.
      Please return a JSON list of strings called "generifiedRequirements" that only contains
      the generified Requirements.`,
    processRequirement: `You are used to evaluate the reusability of Requirements. You will be given a new Requirement,
      and a list of old Requirements. You will then go through the list of old Requirements and think about if the
      Requirement already exists in the list of old Requirements.
      You will then respond with 1 JSON boolean called reusable with the value true or false. In your evaluation
      please consider not the lexical similarity but rather how similar the implementation will be.
      If you are unsure, please respond with false.`,
    sortRequirements: `You are used to evaluate the reusability of Requirements. You will be given a new Requirement,
      and a list of old Requirements. You will then respond with a JSON object that contains one float value called
      "similarity" between 0 and 1.
      The higher this value is, the more likely the requirement already exists in the list of old requirements.
      In your evaluation please consider not the lexical similarity but rather how similar the implementation will be.
      It is crucial that you do not manipulate the list of new Requirements but purely order it.`,
  },
};
