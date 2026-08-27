// Typed wrappers around every operation of the CharityHub GraphQL API.
// Server-side only (see ./graphql.ts). Authenticated operations take the JWT
// explicitly; the API decides what that token is allowed to do.
import { gql, GraphQLRequestError } from "./graphql";
import type {
  Campaign,
  CampaignInput,
  Donation,
  Health,
  User,
} from "./types";

const CAMPAIGN_FIELDS =
  "id title description targetAmount collectedAmount status createdAt updatedAt";
const DONATION_FIELDS = "id amount donorName campaignId userId createdAt";
const USER_FIELDS = "id name email role createdAt";

// --- Public queries --------------------------------------------------------

export async function getHealth(): Promise<Health> {
  const data = await gql<{ health: Health }>(
    `{ health { status database timestamp } }`,
  );
  return data.health;
}

export async function getCampaigns(): Promise<Campaign[]> {
  const data = await gql<{ campaigns: Campaign[] }>(
    `{ campaigns { ${CAMPAIGN_FIELDS} } }`,
  );
  return data.campaigns;
}

/** Returns null when the id is unknown (or not a valid UUID). */
export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const data = await gql<{ campaign: Campaign }>(
      `query ($id: ID!) { campaign(id: $id) { ${CAMPAIGN_FIELDS} } }`,
      { id },
    );
    return data.campaign;
  } catch (error) {
    if (error instanceof GraphQLRequestError) return null;
    throw error;
  }
}

export async function getDonations(campaignId: string): Promise<Donation[]> {
  const data = await gql<{ donations: Donation[] }>(
    `query ($campaignId: ID!) { donations(campaignId: $campaignId) { ${DONATION_FIELDS} } }`,
    { campaignId },
  );
  return data.donations;
}

// --- Authentication --------------------------------------------------------

/** Returns null for a missing, invalid, or expired token. */
export async function getCurrentUser(
  token: string | undefined,
): Promise<User | null> {
  if (!token) return null;
  try {
    const data = await gql<{ me: User }>(
      `{ me { ${USER_FIELDS} } }`,
      undefined,
      token,
    );
    return data.me;
  } catch (error) {
    if (error instanceof GraphQLRequestError) return null;
    throw error;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<{ accessToken: string; user: User }> {
  const data = await gql<{ login: { accessToken: string; user: User } }>(
    `mutation ($input: LoginInput!) { login(input: $input) { accessToken user { ${USER_FIELDS} } } }`,
    { input: { email, password } },
  );
  return data.login;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<{ accessToken: string; user: User }> {
  const data = await gql<{ register: { accessToken: string; user: User } }>(
    `mutation ($input: RegisterInput!) { register(input: $input) { accessToken user { ${USER_FIELDS} } } }`,
    { input: { name, email, password } },
  );
  return data.register;
}

// --- Donations (authenticated) --------------------------------------------

export async function createDonation(
  token: string,
  input: { campaignId: string; amount: string; donorName: string },
): Promise<Donation> {
  const data = await gql<{ createDonation: Donation }>(
    `mutation ($input: CreateDonationInput!) { createDonation(input: $input) { ${DONATION_FIELDS} } }`,
    { input },
    token,
  );
  return data.createDonation;
}

export async function getMyDonations(token: string): Promise<Donation[]> {
  const data = await gql<{ myDonations: Donation[] }>(
    `{ myDonations { ${DONATION_FIELDS} } }`,
    undefined,
    token,
  );
  return data.myDonations;
}

// --- Campaign management (ADMIN) ------------------------------------------

export async function createCampaign(
  token: string,
  input: CampaignInput,
): Promise<Campaign> {
  const data = await gql<{ createCampaign: Campaign }>(
    `mutation ($input: CreateCampaignInput!) { createCampaign(input: $input) { ${CAMPAIGN_FIELDS} } }`,
    { input },
    token,
  );
  return data.createCampaign;
}

export async function updateCampaign(
  token: string,
  id: string,
  input: Partial<CampaignInput>,
): Promise<Campaign> {
  const data = await gql<{ updateCampaign: Campaign }>(
    `mutation ($id: ID!, $input: UpdateCampaignInput!) { updateCampaign(id: $id, input: $input) { ${CAMPAIGN_FIELDS} } }`,
    { id, input },
    token,
  );
  return data.updateCampaign;
}

export async function closeCampaign(
  token: string,
  id: string,
): Promise<Campaign> {
  const data = await gql<{ closeCampaign: Campaign }>(
    `mutation ($id: ID!) { closeCampaign(id: $id) { ${CAMPAIGN_FIELDS} } }`,
    { id },
    token,
  );
  return data.closeCampaign;
}

export async function deleteCampaign(
  token: string,
  id: string,
): Promise<Campaign> {
  const data = await gql<{ deleteCampaign: Campaign }>(
    `mutation ($id: ID!) { deleteCampaign(id: $id) { ${CAMPAIGN_FIELDS} } }`,
    { id },
    token,
  );
  return data.deleteCampaign;
}
