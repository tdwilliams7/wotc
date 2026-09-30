import { gql } from "@apollo/client";

export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    id
    name
    gameId
    format
    startsAt
    durationMinutes
    capacity
    registeredCount
  }
`;

export const TEMPLATES_QUERY = gql`
  query Templates {
    templates {
      id
      name
      formats
      defaultDurationMinutes
      defaultCapacity
      maxCapacity
      minPlayers
    }
  }
`;

export const EVENTS_QUERY = gql`
  ${EVENT_FIELDS}
  query Events {
    events {
      ...EventFields
    }
  }
`;

export const CREATE_EVENT = gql`
  ${EVENT_FIELDS}
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      ...EventFields
    }
  }
`;

export const REGISTER = gql`
  ${EVENT_FIELDS}
  mutation Register($eventId: ID!, $name: String!) {
    register(eventId: $eventId, name: $name) {
      __typename
      ... on RegisterSuccess {
        event {
          ...EventFields
        }
      }
      ... on RegisterError {
        code
        message
      }
    }
  }
`;
