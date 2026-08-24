import { gql } from '@apollo/client';

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        username
        email
        createdAt
        bestScore
        totalGames
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        username
        email
        createdAt
        bestScore
        totalGames
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      username
      email
      createdAt
      bestScore
      totalGames
    }
  }
`;

export const SUBMIT_GAME_MUTATION = gql`
  mutation SubmitGameResult($input: SubmitGameInput!) {
    submitGameResult(input: $input) {
      id
      userId
      totalTime
      rawTime
      penaltyTime
      wrongAttempts
      correctCharacters
      accuracy
      completedAt
      isBestScore
    }
  }
`;

export const LEADERBOARD_QUERY = gql`
  query GetLeaderboard($limit: Int) {
    leaderboard(limit: $limit) {
      rank
      userId
      username
      bestTime
      accuracy
      gamesPlayed
    }
    globalStats {
      totalGamesPlayed
      globalBestTime
      totalRegisteredUsers
    }
  }
`;

export const USER_HISTORY_QUERY = gql`
  query GetUserHistory($limit: Int, $offset: Int) {
    userHistory(limit: $limit, offset: $offset) {
      id
      userId
      totalTime
      rawTime
      penaltyTime
      wrongAttempts
      correctCharacters
      accuracy
      completedAt
      isBestScore
    }
  }
`;
