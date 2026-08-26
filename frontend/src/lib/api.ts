import { gql, GraphQLRequestError } from "./graphql";
import type { Campaign, Donation, User } from "./types";

const CAMPAIGN_FIELDS =
  "id title description targetAmount collectedAmount status createdAt updatedAt";

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
    `query ($campaignId: ID!) { donations(campaignId: $campaignId) { id amount donorName campaignId userId createdAt } }`,
    { campaignId },
  );
  return data.donations;
}

/** Returns null for a missing, invalid, or expired token. */
export async function getCurrentUser(
  token: string | undefined,
): Promise<User | null> {
  if (!token) return null;
  try {
    const data = await gql<{ me: User }>(
      `{ me { id name email role } }`,
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
    `mutation ($input: LoginInput!) { login(input: $input) { accessToken user { id name email role } } }`,
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
    `mutation ($input: RegisterInput!) { register(input: $input) { accessToken user { id name email role } } }`,
    { input: { name, email, password } },
  );
  return data.register;
}

export async function createDonation(
  token: string,
  input: { campaignId: string; amount: string; donorName: string },
): Promise<Donation> {
  const data = await gql<{ createDonation: Donation }>(
    `mutation ($input: CreateDonationInput!) { createDonation(input: $input) { id amount donorName campaignId userId createdAt } }`,
    { input },
    token,
  );
  return data.createDonation;
}
