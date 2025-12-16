export const typeDefs = `#graphql
  type CategoryStat {
    played: Int!
    won: Int!
  }

  type AllCategoryStats {
    outline: CategoryStat!
    capital: CategoryStat!
    flag: CategoryStat!
  }

  type UserStats {
    gamesPlayed: Int!
    gamesWon: Int!
    totalScore: Int!
    bestStreak: Int!
    categoryStats: AllCategoryStats!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    avatar: String
    stats: UserStats
    createdAt: String
  }

  type Question {
    id: ID!
    questionText: String!
    imageUrl: String
    options: [String!]!
  }

  type Quiz {
    id: ID!
    title: String!
    type: String!
    questions: [Question!]!
  }

  type PlayerState {
    userId: ID
    username: String!
    avatar: String
    score: Int!
    isReady: Boolean!
    hasAnsweredCurrent: Boolean!
    streak: Int!
  }

  type RoomConfig {
    mode: String!
    type: String!
    difficulty: String!
    region: String
    isRanked: Boolean!
  }

  type Room {
    id: ID!
    code: String!
    host: User # The host user object (resolved)
    config: RoomConfig!
    status: String! # WAITING, PLAYING, FINISHED
    players: [PlayerState!]!
    currentQuestionIndex: Int!
    questions: [Question!]! # The actual questions for this game
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # --- QUERIES ---
  type Query {
    me: User
    getLeaderboard: [User!]!
    getRoom(code: String!): Room
  }

  # --- MUTATIONS ---
  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Room Management
    createRoom(config: RoomConfigInput!): Room!
    joinRoom(code: String!): Room!
    leaveRoom(code: String!): Boolean
    
    # Game Flow
    startGame(code: String!): Room!
    submitAnswer(code: String!, answerIndex: Int!): Room!
  }

  input RoomConfigInput {
    mode: String!      # SINGLE, MULTI
    type: String!      # CAPITALS, FLAGS, BORDERS
    difficulty: String # EASY, MEDIUM, HARD
    region: String
    isRanked: Boolean
  }

  # --- SUBSCRIPTIONS ---
  type Subscription {
    roomUpdated(code: String!): Room!
  }
`;