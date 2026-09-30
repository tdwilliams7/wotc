import { createSchema } from "graphql-yoga";
import { pool } from "./db";
import { listTemplates } from "./modules/templates/repo";
import { createEvent, getEvent, listEvents } from "./modules/events/service";
import { register } from "./modules/registrations/service";

const typeDefs = /* GraphQL */ `
  type GameTemplate {
    id: ID!
    name: String!
    formats: [String!]!
    defaultDurationMinutes: Int!
    defaultCapacity: Int!
    maxCapacity: Int!
    minPlayers: Int!
  }

  type Event {
    id: ID!
    name: String!
    gameId: ID!
    format: String!
    "Store-local time, YYYY-MM-DDTHH:mm"
    startsAt: String!
    durationMinutes: Int!
    capacity: Int!
    registeredCount: Int!
  }

  input CreateEventInput {
    name: String!
    gameId: ID!
    format: String!
    "YYYY-MM-DD, store-local"
    startDate: String!
    "HH:mm, store-local"
    startTime: String!
    "Defaults to the game template's duration"
    durationMinutes: Int
    "Defaults to the game template's capacity"
    capacity: Int
  }

  enum RegisterErrorCode {
    NOT_FOUND
    INVALID_NAME
    DUPLICATE
    EVENT_FULL
  }

  type RegisterSuccess {
    event: Event!
  }

  type RegisterError {
    code: RegisterErrorCode!
    message: String!
  }

  union RegisterResult = RegisterSuccess | RegisterError

  type Query {
    templates: [GameTemplate!]!
    events: [Event!]!
    event(id: ID!): Event
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    register(eventId: ID!, name: String!): RegisterResult!
  }
`;

export const schema = createSchema({
  typeDefs,
  resolvers: {
    Query: {
      templates: () => listTemplates(pool),
      events: () => listEvents(pool),
      event: (_: unknown, { id }: { id: string }) => getEvent(pool, id),
    },
    Mutation: {
      createEvent: (_: unknown, { input }: { input: any }) =>
        createEvent(pool, input),
      register: async (
        _: unknown,
        { eventId, name }: { eventId: string; name: string },
      ) => {
        const r = await register(pool, eventId, name);
        return r.ok
          ? { __typename: "RegisterSuccess", event: r.event }
          : { __typename: "RegisterError", code: r.code, message: r.message };
      },
    },
    RegisterResult: {
      __resolveType: (o: { __typename: string }) => o.__typename,
    },
  },
});
