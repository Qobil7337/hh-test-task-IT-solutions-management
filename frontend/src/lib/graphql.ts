// Minimal GraphQL client for the CharityHub API. Server-side only: it is used
// by Server Components and Server Actions, so the backend URL and the user's
// token never reach the browser.
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:3000/graphql";

interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    originalError?: { message?: string | string[] };
  };
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: GraphQLError[];
}

export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "GraphQLRequestError";
  }
}

// NestJS validation errors put the useful text in extensions.originalError.
function describe(error: GraphQLError): string {
  const original = error.extensions?.originalError?.message;
  if (Array.isArray(original)) return original.join(", ");
  if (typeof original === "string") return original;
  return error.message;
}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new GraphQLRequestError(
      `CharityHub API responded with HTTP ${response.status}`,
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new GraphQLRequestError(
      json.errors.map(describe).join("; "),
      json.errors[0].extensions?.code,
    );
  }
  if (!json.data) {
    throw new GraphQLRequestError("Empty response from the CharityHub API");
  }
  return json.data;
}
