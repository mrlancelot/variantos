import { BrowserUse } from "browser-use-sdk";
import { z } from "zod";
import { Issue } from "./types";
import { v4 as uuidv4 } from "uuid";

const IssueSchema = z.object({
  issues: z.array(
    z.object({
      type: z.enum(["bug", "ux", "accessibility", "performance"]),
      description: z.string(),
      severity: z.enum(["high", "medium", "low"]),
      stepsToReproduce: z.string(),
      element: z.string().optional(),
    })
  ),
});

function getClient() {
  return new BrowserUse({
    apiKey: process.env.BROWSER_USE_API_KEY,
  });
}

// Create a session first → get liveUrl → then pass sessionId to run()
// This way the liveUrl iframe shows the actual browser being used for the task
export async function createBrowserSession(): Promise<{
  sessionId: string;
  liveUrl: string;
}> {
  const client = getClient();
  const session = await client.sessions.create();
  return {
    sessionId: session.id,
    liveUrl: session.liveUrl || "",
  };
}

export async function findIssues(
  sessionId: string,
  appUrl: string,
  goal?: string
): Promise<Issue[]> {
  const client = getClient();

  const taskPrompt = `You are a QA engineer testing a web application at ${appUrl}.

Navigate to the app and test it thoroughly:
- Click every button and interactive element
- Try to fill out and submit any forms
- Navigate through all pages/sections
- Look for broken functionality, missing features, UX issues, and accessibility problems
${goal ? `\nSpecific focus: ${goal}` : ""}

Report all bugs, UX issues, and accessibility problems you find. Be specific about what's broken and how to reproduce it.`;

  const result = await client.run(taskPrompt, {
    schema: IssueSchema,
    startUrl: appUrl,
    sessionId,
  });

  const issues: Issue[] = (result.output?.issues || []).map(
    (issue: z.infer<typeof IssueSchema>["issues"][number]) => ({
      id: uuidv4(),
      ...issue,
    })
  );

  return issues;
}

// Fallback: hardcoded issues for demo reliability
export function getHardcodedIssues(): Issue[] {
  return [
    {
      id: uuidv4(),
      type: "bug",
      description:
        "The 'Add to Cart' button does not work. Clicking it produces no visible effect and the cart count does not update.",
      severity: "high",
      stepsToReproduce:
        "1. Navigate to the product listing page\n2. Click 'Add to Cart' on any product\n3. Observe that nothing happens",
      element: "Add to Cart button",
    },
    {
      id: uuidv4(),
      type: "ux",
      description:
        "There is no way to search or filter products. Users must scroll through the entire product list to find what they want.",
      severity: "medium",
      stepsToReproduce:
        "1. Navigate to the product listing page\n2. Look for a search bar or filter options\n3. None exist",
      element: "Product listing page",
    },
    {
      id: uuidv4(),
      type: "bug",
      description:
        "The checkout form can be submitted with all fields empty. No validation is performed on required fields like name, email, and address.",
      severity: "high",
      stepsToReproduce:
        "1. Navigate to the checkout page\n2. Leave all fields empty\n3. Click 'Place Order'\n4. Form submits successfully with no errors",
      element: "Checkout form",
    },
  ];
}
